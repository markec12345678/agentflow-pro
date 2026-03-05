import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/database/schema";
import { getUser } from "@/lib/auth-users";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const authOptions = {
  trustHost: true,
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
        GoogleProvider({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) {
          console.log("[auth] authorize: missing email or password");
          return null;
        }
        try {
          const u = await getUser(email, password);
          if (!u) {
            console.log("[auth] authorize: getUser returned null for", email);
            return null;
          }
          console.log("[auth] authorize: OK for", email);
          return { id: u.id, email, name: email };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          try {
            const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const normalizedEmail = user.email.toLowerCase().trim();
            const dbUser = await prisma.user.upsert({
              where: { email: normalizedEmail },
              update: { name: user.name ?? undefined },
              create: {
                email: normalizedEmail,
                name: user.name ?? null,
                trialEndsAt,
              },
              select: { id: true },
            });
            token.userId = dbUser.id;
          } catch (err) {
            console.error("[auth] JWT google upsert error:", err);
          }
        } else {
          token.userId = user.id;
        }
      }
      if (token.userId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: {
              id: true,
              trialEndsAt: true,
              activeTeamId: true,
              subscription: true,
            },
          });
          if (dbUser) {
            token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null;
            token.subscriptionActive =
              !!dbUser.subscription?.stripeSubscriptionId &&
              dbUser.subscription.status !== "canceled";
            if (dbUser.activeTeamId) {
              const membership = await prisma.teamMember.findUnique({
                where: { userId_teamId: { userId: dbUser.id, teamId: dbUser.activeTeamId } },
              });
              if (membership) {
                token.teamId = membership.teamId;
                token.teamRole = membership.role;
              }
            }
          }
          if (!token.teamId) {
            const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
            const memberships = await prisma.teamMember.findMany({
              where: { userId: token.userId as string },
            });
            const sorted = memberships.sort(
              (a, b) => (roleOrder[a.role as keyof typeof roleOrder] ?? 4) - (roleOrder[b.role as keyof typeof roleOrder] ?? 4)
            );
            const first = sorted[0];
            if (first) {
              token.teamId = first.teamId;
              token.teamRole = first.role;
            }
          }
        } catch (err) {
          console.error("[auth] JWT callback db error:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const uid = token.userId as string;
        (session.user as { userId?: string }).userId = uid;
        if (uid) (session.user as { id?: string }).id = uid;
        (session.user as { trialEndsAt?: string | null }).trialEndsAt =
          token.trialEndsAt as string | null | undefined;
        (session.user as { subscriptionActive?: boolean }).subscriptionActive =
          token.subscriptionActive as boolean | undefined;
        (session.user as { teamId?: string }).teamId = token.teamId as string | undefined;
        (session.user as { teamRole?: string }).teamRole = token.teamRole as string | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl.replace(/\/$/, "")}${url}`;
      try {
        const u = new URL(url);
        if (u.pathname) return `${baseUrl.replace(/\/$/, "")}${u.pathname}${u.search || ""}`;
      } catch {
        // ignore
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login", // Custom sign-in page
  },
} as NextAuthOptions;
