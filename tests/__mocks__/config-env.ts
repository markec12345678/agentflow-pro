/**
 * Mock for @/config/env - used by batch-translate tests
 */
export function getOpenAiApiKey(): string {
  return process.env.OPENAI_API_KEY ?? "";
}

export function getSerpApiKey(): string {
  return process.env.SERPAPI_API_KEY ?? "";
}

export function getContext7ApiKey(): string {
  return process.env.CONTEXT7_API_KEY ?? "";
}

export function getFirecrawlApiKey(): string {
  return process.env.FIRECRAWL_API_KEY ?? "";
}

export function getAdminEmails(): string[] {
  return [];
}
