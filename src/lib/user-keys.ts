/**
 * AgentFlow Pro - User API Keys (BYOK)
 * Store and retrieve per-user API keys for Firecrawl, Context7, etc.
 */

import { prisma } from "@/database/schema";

const _PROVIDERS = [
  "firecrawl",
  "context7",
  "serpapi",
  "openai",
  "github",
  "vercel",
  "netlify",
  "wordpress",
  "medium",
  "linkedin",
  "twitter",
  "mailchimp",
  "hubspot",
  "google_search_console",
  "meta",
  "booking_affiliate",
] as const;

export type ApiKeyProvider = (typeof _PROVIDERS)[number];

function maskKey(value: string): string {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

/**
 * Get user API keys - returns masked values for display (GET)
 * or full values when needed for execution (internal use).
 */
export async function getUserApiKeys(
  userId: string,
  options?: { masked?: boolean }
): Promise<Record<string, string>> {
  const masked = options?.masked ?? true;

  try {
    const keys = await prisma.userApiKey.findMany({
      where: { userId },
    });

    const result: Record<string, string> = {};
    for (const k of keys) {
      result[k.provider] = masked ? maskKey(k.value) : k.value;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Get full user API keys for workflow execution (internal only).
 */
export async function getUserApiKeysForExecution(
  userId: string
): Promise<Record<string, string>> {
  return getUserApiKeys(userId, { masked: false });
}

/**
 * Set a single user API key (upsert by userId + provider).
 */
export async function setUserApiKey(
  userId: string,
  provider: string,
  value: string
): Promise<void> {
  if (!value.trim()) return;

  await prisma.userApiKey.upsert({
    where: {
      userId_provider: { userId, provider },
    },
    create: { userId, provider, value: value.trim() },
    update: { value: value.trim() },
  });
}

/**
 * Set multiple user API keys from a record.
 */
export async function setUserApiKeys(
  userId: string,
  keys: Record<string, string>
): Promise<void> {
  for (const [provider, value] of Object.entries(keys)) {
    if (value?.trim()) {
      await setUserApiKey(userId, provider, value.trim());
    }
  }
}
