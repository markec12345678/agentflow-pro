/**
 * Auth users - Prisma + bcryptjs (same as seed, cross-platform)
 */

import bcrypt from "bcryptjs";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/database/schema";
import type { Session } from "next-auth";

const SALT_ROUNDS = 10;

/**
 * Extract user ID from session (supports both custom credentials and Google OAuth).
 * Prefer userId (from JWT token) > id (NextAuth, may be our cuid for Credentials) > email (fallback, may not match Prisma userId).
 */
export function getUserId(session: Session | null): string | null {
  if (!session?.user) return null;
  const uid = (session.user as { userId?: string }).userId;
  if (uid) return uid;
  const id = (session.user as { id?: string }).id;
  if (id) return id;
  if (session.user?.email) return session.user.email;
  return null;
}

export async function registerUser(
  email: string,
  password: string,
  name?: string | null
): Promise<{ id: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedPassword = password.trim();
  if (!trimmedPassword) return null;
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) return null;

  const passwordHash = await bcrypt.hash(trimmedPassword, SALT_ROUNDS);
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name?.trim() || null,
        trialEndsAt,
      },
      select: { id: true },
    });
    return { id: user.id };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return null;
    throw e;
  }
}

/**
 * Change password (for logged-in user via session).
 * Verifies current password, hashes and saves new one.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) throw new Error("User not found");
  const valid = await bcrypt.compare(currentPassword.trim(), user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");
  const trimmed = newPassword.trim();
  if (!trimmed || trimmed.length < 8) throw new Error("New password must be at least 8 characters");
  const passwordHash = await bcrypt.hash(trimmed, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, updatedAt: new Date() },
  });
}

export async function getUser(
  email: string,
  password: string
): Promise<{ id: string } | null> {
  try {
    const normEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normEmail },
      select: { id: true, passwordHash: true },
    });
    if (!user?.passwordHash) {
      if (process.env.NODE_ENV === "development") {
        logger.info("[auth] getUser: user not found or no passwordHash for", normEmail);
      }
      return null;
    }

    const valid = await bcrypt.compare(password.trim(), user.passwordHash);
    if (!valid) {
      if (process.env.NODE_ENV === "development") {
        logger.info("[auth] getUser: password mismatch for", normEmail);
      }
      return null;
    }

    return { id: user.id };
  } catch (err) {
    logger.error("[auth] getUser error:", err);
    return null;
  }
}
