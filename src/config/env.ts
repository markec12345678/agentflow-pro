/**
 * Centralized env access for API keys and config
 */

export function getOpenAiApiKey(): string {
  return process.env.OPENAI_API_KEY?.trim() ?? "";
}

/** Google Gemini API key – trajno v .env, ne izgubi se */
export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

/** Alibaba Qwen (DashScope) – OpenAI-compatible. Fallback če OPENAI_API_KEY prazen. */
export function getQwenApiKey(): string {
  return process.env.ALIBABA_QWEN_API_KEY?.trim() ?? "";
}

/** Vrne OpenAI, Gemini ali Qwen API key (prioriteta). Gemini za LLM. */
export function getLlmApiKey(): { apiKey: string; baseURL?: string; model: string } {
  const openai = getOpenAiApiKey();
  if (openai) return { apiKey: openai, model: "gpt-4o-mini" };
  const gemini = getGeminiApiKey();
  if (gemini) {
    return {
      apiKey: gemini,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: "gemini-2.0-flash",
    };
  }
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

/** Vrne LLM config iz userKeys ali env. Prioriteta: openai > gemini > env. */
export function getLlmFromUserKeys(userKeys?: Record<string, string>): {
  apiKey: string;
  baseURL?: string;
  model: string;
} {
  const openai = userKeys?.openai?.trim();
  if (openai) return { apiKey: openai, model: "gpt-4o-mini" };
  const gemini = userKeys?.gemini?.trim();
  if (gemini) {
    return {
      apiKey: gemini,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: "gemini-2.0-flash",
    };
  }
  return getLlmApiKey();
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

/** WhatsApp Business Cloud API - required for sending WhatsApp messages */
export function getWhatsAppConfig(): {
  phoneNumberId: string;
  accessToken: string;
} {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? "";
  return { phoneNumberId, accessToken };
}
