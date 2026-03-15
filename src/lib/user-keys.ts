/**
 * User API keys - stored in UserApiKey model
 */

import { prisma } from "@/database/schema";
import { logger } from '@/infrastructure/observability/logger';

export type ApiKeyProvider =
  | "firecrawl"
  | "context7"
  | "serpapi"
  | "openai"
  | "gemini"
  | "github"
  | "vercel"
  | "netlify"
  | "wordpress"
  | "medium"
  | "linkedin"
  | "twitter"
  | "mailchimp"
  | "hubspot";

const EXECUTION_PROVIDERS: ApiKeyProvider[] = [
  "firecrawl",
  "context7",
  "serpapi",
  "openai",
  "github",
  "vercel",
  "netlify",
];

async function findUserApiKeys(
  where: { userId: string; provider?: { in: string[] } }
): Promise<Array<{ provider: string; value: string }>> {
  try {
    return await prisma.userApiKey.findMany({
      where,
      select: { provider: true, value: true },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist")) {
      logger.warn("[user-keys] UserApiKey table missing, run: npx prisma migrate deploy");
      return [];
    }
    throw err;
  }
}

export async function getUserApiKeys(
  userId: string,
  options?: { masked?: boolean }
): Promise<Record<string, string>> {
  const keys = await findUserApiKeys({ userId });
  const out: Record<string, string> = {};
  for (const k of keys) {
    out[k.provider] = options?.masked ? maskValue(k.value) : k.value;
  }
  return out;
}

export async function getUserApiKeysForExecution(
  userId: string
): Promise<Record<string, string>> {
  const keys = await findUserApiKeys({
    userId,
    provider: { in: EXECUTION_PROVIDERS },
  });
  const out: Record<string, string> = {};
  for (const k of keys) {
    out[k.provider] = k.value;
  }
  return out;
}

export async function setUserApiKey(
  userId: string,
  provider: string,
  value: string
): Promise<void> {
  try {
    await prisma.userApiKey.upsert({
      where: {
        userId_provider: { userId, provider },
      },
      create: { userId, provider, value },
      update: { value },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist")) {
      throw new Error(
        "Tabela UserApiKey manjka. Zaženi: npx prisma migrate deploy. Ali dodaj ključ v .env (npr. GEMINI_API_KEY=...) – ta ostane trajno."
      );
    }
    throw err;
  }
}

export async function setUserApiKeys(
  userId: string,
  keys: Record<string, string>
): Promise<void> {
  for (const [provider, value] of Object.entries(keys)) {
    if (value.trim()) {
      await setUserApiKey(userId, provider, value);
    } else {
      try {
        await prisma.userApiKey.deleteMany({
          where: { userId, provider },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("does not exist")) throw err;
      }
    }
  }
}

function maskValue(val: string): string {
  if (!val || val.length < 8) return "****";
  return val.slice(0, 4) + "****" + val.slice(-4);
}
