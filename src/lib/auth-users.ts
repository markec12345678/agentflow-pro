/**
 * Auth users - Prisma + bcrypt for credentials
 */

import bcrypt from "bcrypt";
import { prisma } from "@/database/schema";

const SALT_ROUNDS = 10;

export async function registerUser(
  email: string,
  password: string
): Promise<{ id: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) return null;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
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
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id };
}
