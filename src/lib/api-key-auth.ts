/**
 * AgentFlow Pro - Public API key authentication
 */

import { createHash } from "crypto";
import { prisma } from "@/database/schema";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export interface ApiKeyValidation {
  userId: string;
  keyId: string;
}

/**
 * Validates Bearer API key and returns userId and keyId if valid.
 */
export async function validateApiKey(authHeader: string | null): Promise<ApiKeyValidation | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) return null;

  const keyHash = hashKey(rawKey);
  const key = await prisma.apiKey.findFirst({
    where: { keyHash },
  });
  if (!key) return null;
  return { userId: key.userId, keyId: key.id };
}
