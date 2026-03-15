import type { NextAuthOptions } from "next-auth";
import { logger } from '@/infrastructure/observability/logger';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/infrastructure/database/prisma";
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

  if (!process.env.NEXTAUTH_URL) {
    warnings.push("NEXTAUTH_URL is not set - using default");
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
  databaseUrl: process.env.DATABASE_URL ? "SET" : "MISSING",
  nextauthSecret: process.env.NEXTAUTH_SECRET ? "SET" : "MISSING",
  configStatus,
});

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  trustHost: true,
  providers: [
    // Google Provider - ALWAYS INCLUDED (env vars are set)
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),

    // Credentials Provider
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        logger.info("[AUTH] authorize called:", {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
        });

        const email = credentials?.email?.toLowerCase()?.trim();
        const password = credentials?.password;

        if (!email || !password) {
          logger.info("[AUTH] Missing credentials");
          return null;
        }

        try {
          const user = await getUser(email, password);
          logger.info("[AUTH] getUser result:", user ? user.id : "null");

          if (user) {
            return {
              id: user.id,
              email: email,
              name: email,
            };
          }

          return null;
        } catch (error) {
          logger.error("[AUTH] Error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      logger.info("[AUTH] signIn callback:", {
        provider: account?.provider,
        email: user?.email,
        hasProfile: !!profile,
      });

      try {
        if (account?.provider === "google") {
          logger.info("[AUTH] Google OAuth sign in for:", user.email, {
            hasAccessToken: !!account.access_token,
            hasRefreshToken: !!account.refresh_token,
            scope: account.scope,
          });

          // Validate required Google profile fields
          if (!user.email) {
            logger.error("[AUTH] Google OAuth failed: No email in profile");
            return false;
          }

          if (!("email_verified" in profile) || !profile.email_verified) {
            logger.warn(
              "[AUTH] Google email not verified for:",
              user.email
            );
          }

          logger.info("[AUTH] Google OAuth sign in successful for:", user.email);
          return true;
        }

        // Allow credentials login
        return true;
      } catch (error) {
        logger.error("[AUTH] signIn callback error:", {
          provider: account?.provider,
          email: user?.email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        return false;
      }
    },

    async session({ session, user }: any) {
      logger.info("[SESSION] callback:", {
        userId: user?.id,
        sessionUser: session?.user?.email,
      });

      try {
        if (user?.id) {
          session.user.userId = user.id;
          session.user.id = user.id;
        }

        return session;
      } catch (error) {
        logger.error("[AUTH] session callback error:", {
          error: error instanceof Error ? error.message : String(error),
          sessionUserId: session?.user?.id,
        });
        return session;
      }
    },
  },
  events: {
    async createUser({ user }) {
      logger.info("[AUTH] New user created via OAuth:", {
        email: user.email,
        id: user.id,
        name: user.name,
      });

      try {
        // Update trial period for new Google OAuth users
        if (user.email) {
          const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await prisma.user.update({
            where: { id: user.id },
            data: { trialEndsAt },
          });
          logger.info("[AUTH] Trial period set for new user:", user.email, {
            trialEndsAt: trialEndsAt.toISOString(),
          });
        }
      } catch (error) {
        logger.error("[AUTH] createUser event error:", {
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Don't throw - let the user creation succeed even if trial setup fails
      }
    },

    async signIn({ user, account }) {
      logger.info("[AUTH] signIn event:", {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
      });

      try {
        if (account?.provider === "google" && user.email) {
          // Ensure user exists in database with proper trial
          const normalizedEmail = user.email.toLowerCase().trim();
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!existingUser) {
            logger.info(
              "[AUTH] Creating user record for Google sign in:",
              normalizedEmail
            );
            const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: user.name,
                emailVerified: new Date(),
                image: user.image,
                trialEndsAt,
              },
            });
          } else if (!existingUser.trialEndsAt) {
            // Set trial if not already set
            const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { trialEndsAt },
            });
            logger.info("[AUTH] Trial period added to existing user:", {
              email: normalizedEmail,
              trialEndsAt: trialEndsAt.toISOString(),
            });
          }
        }
      } catch (error) {
        logger.error("[AUTH] signIn event error:", {
          userId: user.id,
          email: user.email,
          provider: account?.provider,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  },
  pages: {
    signIn: "/login",
  },
} as NextAuthOptions;
