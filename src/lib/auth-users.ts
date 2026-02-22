/**
 * Auth users - Prisma + bcrypt for credentials
 */

import bcrypt from "bcrypt";
import { prisma } from "@/database/schema";
import type { Session } from "next-auth";

const SALT_ROUNDS = 10;

/**
 * Extract user ID from session (supports both custom credentials and Google OAuth)
 */
export function getUserId(session: Session | null): string | null {
  if (!session) return null;
  if ((session.user as { userId?: string }).userId) {
    return (session.user as { userId: string }).userId;
  }
  if (session.user?.email) {
    return session.user.email;
  }
  return null;
}

export async function registerUser(
  email: string,
  password: string
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
    if (!user?.passwordHash) return null;

    const valid = await bcrypt.compare(password.trim(), user.passwordHash);
    if (!valid) return null;

    return { id: user.id };
  } catch (err) {
    console.error("[auth] getUser error:", err);
    return null;
  }
}
