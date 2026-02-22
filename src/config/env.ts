/**
 * Centralized env access for API keys and config
 */

export function getOpenAiApiKey(): string {
  return process.env.OPENAI_API_KEY?.trim() ?? "";
}

/** Alibaba Qwen (DashScope) – OpenAI-compatible. Fallback če OPENAI_API_KEY prazen. */
export function getQwenApiKey(): string {
  return process.env.ALIBABA_QWEN_API_KEY?.trim() ?? "";
}

/** Vrne OpenAI ali Qwen API key (prioriteta OpenAI). */
export function getLlmApiKey(): { apiKey: string; baseURL?: string; model: string } {
  const openai = getOpenAiApiKey();
  if (openai) return { apiKey: openai, model: "gpt-4o-mini" };
  const qwen = getQwenApiKey();
  if (qwen) {
    return {
      apiKey: qwen,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: "qwen-turbo",
    };
  }
  return { apiKey: "", model: "gpt-4o-mini" };
}

export function getContext7ApiKey(): string {
  return process.env.CONTEXT7_API_KEY ?? "";
}

export function getFirecrawlApiKey(): string {
  return process.env.FIRECRAWL_API_KEY ?? "";
}

export function getSerpApiKey(): string {
  return process.env.SERPAPI_API_KEY ?? "";
}

export function getHubSpotClientId(): string {
  return process.env.HUBSPOT_CLIENT_ID ?? "";
}

export function getHubSpotClientSecret(): string {
  return process.env.HUBSPOT_CLIENT_SECRET ?? "";
}

export function getLinkedInClientId(): string {
  return process.env.LINKEDIN_CLIENT_ID ?? "";
}

export function getLinkedInClientSecret(): string {
  return process.env.LINKEDIN_CLIENT_SECRET ?? "";
}

export function getTwitterApiKey(): string {
  return process.env.TWITTER_API_KEY ?? "";
}

export function getTwitterApiSecret(): string {
  return process.env.TWITTER_API_SECRET ?? "";
}

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
