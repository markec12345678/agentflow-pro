import type { NextAuthOptions } from "next-auth";
import { logger } from '@/infrastructure/observability/logger';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/database/schema";
import { getUser } from "@/lib/auth-users";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Validate Google OAuth configuration at startup
function validateGoogleOAuthConfig() {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!googleClientId) {
    errors.push("GOOGLE_CLIENT_ID is not set in environment variables");
  } else {
    if (!googleClientId.endsWith(".apps.googleusercontent.com")) {
      warnings.push(
        `GOOGLE_CLIENT_ID format looks suspicious: ${googleClientId.substring(0, 20)}...`
      );
    }
  }

  if (!googleClientSecret) {
    errors.push("GOOGLE_CLIENT_SECRET is not set in environment variables");
  } else {
    if (!googleClientSecret.startsWith("GOCSPX-")) {
      warnings.push(
        `GOOGLE_CLIENT_SECRET format looks suspicious: ${googleClientSecret.substring(0, 10)}...`
      );
    }
  }

  if (!process.env.NEXTAUTH_SECRET) {
    errors.push("NEXTAUTH_SECRET is not set - required for JWT signing");
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push("NEXTAUTH_SECRET should be at least 32 characters long");
  }

  if (errors.length > 0) {
    logger.error("[AUTH] ❌ CRITICAL ERRORS in Google OAuth configuration:");
    errors.forEach((err) => logger.error(`  - ${err}`));
    logger.error(
      "[AUTH] Google OAuth will NOT work until these are fixed!"
    );
  }

  if (warnings.length > 0) {
    logger.warn("[AUTH] ⚠️  Warnings in Google OAuth configuration:");
    warnings.forEach((warn) => logger.warn(`  - ${warn}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info("[AUTH] ✅ Google OAuth configuration looks valid");
  }

  return {
    googleEnabled: !!(googleClientId && googleClientSecret),
    hasErrors: errors.length > 0,
    errors,
    warnings,
  };
}

// Run validation on module load
const configStatus = validateGoogleOAuthConfig();

logger.info("[Auth] Initializing with:", {
  googleEnabled: configStatus.googleEnabled,
  googleClientId: googleClientId
    ? `${googleClientId.substring(0, 20)}...`
    : "MISSING",
  configStatus,
});

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    // Google Provider - ALWAYS INCLUDED (env vars are set)
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
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
          logger.info("[auth] authorize: missing email or password");
          return null;
        }
        try {
          const u = await getUser(email, password);
          if (!u) {
            logger.info("[auth] authorize: getUser returned null for", email);
            return null;
          }
          logger.info("[auth] authorize: OK for", email);
          return { id: u.id, email, name: email };
        } catch (err) {
          logger.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  session: { 
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60 
  },
  callbacks: {
    async jwt({ token, user, account }) {
      logger.info("[AUTH] JWT callback:", {
        hasUser: !!user,
        provider: account?.provider,
        email: user?.email,
      });

      try {
        if (user) {
          // Handle Google OAuth - create user in DB if needed
          if (account?.provider === "google" && user.email) {
            logger.info("[AUTH] Google OAuth user - creating/updating:", user.email, {
              hasAccessToken: !!account.access_token,
              hasRefreshToken: !!account.refresh_token,
            });

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
              logger.info("[AUTH] Google user upserted:", dbUser.id);
              token.userId = dbUser.id;
            } catch (err) {
              logger.error("[AUTH] JWT google upsert error:", err);
            }
          } else {
            token.userId = user.id;
          }
        }

        // For database strategy, we still need to fetch additional user data
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
            logger.error("[AUTH] JWT callback db error:", err);
          }
        }
        return token;
      } catch (error) {
        logger.error("[AUTH] JWT callback error:", {
          error: error instanceof Error ? error.message : String(error),
          userId: token.userId,
        });
        return token;
      }
    },
    async session({ session, token, user }: any) {
      logger.info("[AUTH] session callback:", {
        userId: token.userId || user?.id,
        hasSession: !!session,
      });

      try {
        if (session.user) {
          const uid = (token.userId || user?.id) as string;
          (session.user as { userId?: string }).userId = uid;
          if (uid) (session.user as { id?: string }).id = uid;
          (session.user as { trialEndsAt?: string | null }).trialEndsAt =
            token.trialEndsAt as string | null | undefined;
          (session.user as { subscriptionActive?: boolean }).subscriptionActive =
            token.subscriptionActive as boolean | undefined;
          (session.user as { teamId?: string }).teamId = token.teamId as string | undefined;
          (session.user as { teamRole?: string }).teamRole = token.teamRole as string | undefined;

          // Debug logging
          logger.info('[AUTH] session callback:', {
            userId: uid,
            hasTeamId: !!token.teamId,
            subscriptionActive: token.subscriptionActive,
          });
        }
        return session;
      } catch (error) {
        logger.error("[AUTH] session callback error:", {
          error: error instanceof Error ? error.message : String(error),
        });
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      logger.info("[AUTH] Redirect callback:", { url, baseUrl });

      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl.replace(/\/$/, "")}${url}`;
        logger.info("[AUTH] Relative redirect:", redirectUrl);
        return redirectUrl;
      }
      // Allows callback URLs on the same origin
      if (url.startsWith(baseUrl)) {
        logger.info("[AUTH] Same origin redirect:", url);
        return url;
      }
      // Default redirect to dashboard
      const defaultRedirect = `${baseUrl}/dashboard`;
      logger.info("[AUTH] Default redirect:", defaultRedirect);
      return defaultRedirect;
    },
  },
  pages: {
    signIn: "/login", // Custom sign-in page
    error: "/login", // Error code passed in query string as ?error=
  },
} as NextAuthOptions;
