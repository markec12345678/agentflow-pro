/**
 * User API keys - stored in UserApiKey model
 */

import { prisma } from "@/database/schema";

export type ApiKeyProvider =
  | "firecrawl"
  | "context7"
  | "serpapi"
  | "openai"
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

export async function getUserApiKeys(
  userId: string,
  options?: { masked?: boolean }
): Promise<Record<string, string>> {
  const keys = await prisma.userApiKey.findMany({
    where: { userId },
    select: { provider: true, value: true },
  });
  const out: Record<string, string> = {};
  for (const k of keys) {
    out[k.provider] = options?.masked ? maskValue(k.value) : k.value;
  }
  return out;
}

export async function getUserApiKeysForExecution(
  userId: string
): Promise<Record<string, string>> {
  const keys = await prisma.userApiKey.findMany({
    where: {
      userId,
      provider: { in: EXECUTION_PROVIDERS },
    },
    select: { provider: true, value: true },
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
  await prisma.userApiKey.upsert({
    where: {
      userId_provider: { userId, provider },
    },
    create: { userId, provider, value },
    update: { value },
  });
}

export async function setUserApiKeys(
  userId: string,
  keys: Record<string, string>
): Promise<void> {
  for (const [provider, value] of Object.entries(keys)) {
    if (value.trim()) {
      await setUserApiKey(userId, provider, value);
    } else {
      await prisma.userApiKey.deleteMany({
        where: { userId, provider },
      });
    }
  }
}

function maskValue(val: string): string {
  if (!val || val.length < 8) return "****";
  return val.slice(0, 4) + "****" + val.slice(-4);
}
