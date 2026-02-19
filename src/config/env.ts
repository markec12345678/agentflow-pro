/**
 * Centralized env access for API keys and config
 */

export function getOpenAiApiKey(): string {
  return process.env.OPENAI_API_KEY ?? "";
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
