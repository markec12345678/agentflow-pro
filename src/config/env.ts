/**
 * AgentFlow Pro - Central API keys config
 *
 * VSI API KLJUČI Gredo v .env.local (gitignored).
 * Ta datoteka jih bere in jih enkratno eksportira.
 *
 * CONTEXT7_API_KEY: context7.com - za Content Agent (searchLibrary, getContext)
 */

export function getContext7ApiKey(): string {
  return process.env.CONTEXT7_API_KEY ?? "";
}

export function getFirecrawlApiKey(): string {
  return process.env.FIRECRAWL_API_KEY ?? "";
}

export function getSerpApiKey(): string {
  return process.env.SERPAPI_API_KEY ?? "";
}

export function getOpenAiApiKey(): string {
  return process.env.OPENAI_API_KEY ?? "";
}

export function getTwitterApiKey(): string {
  return process.env.TWITTER_API_KEY ?? "";
}

export function getTwitterApiSecret(): string {
  return process.env.TWITTER_API_SECRET ?? "";
}

export function getLinkedInClientId(): string {
  return process.env.LINKEDIN_CLIENT_ID ?? "";
}

export function getLinkedInClientSecret(): string {
  return process.env.LINKEDIN_CLIENT_SECRET ?? "";
}

export function getHubSpotClientId(): string {
  return process.env.HUBSPOT_CLIENT_ID ?? "";
}

export function getHubSpotClientSecret(): string {
  return process.env.HUBSPOT_CLIENT_SECRET ?? "";
}

/**
 * Comma-separated list of admin emails. Users with these emails can access /admin.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** Google OAuth - shared for Sign-in and Search Console */
export function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID ?? "";
}

export function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET ?? "";
}

/** Meta (Facebook/Instagram) OAuth */
export function getMetaAppId(): string {
  return process.env.META_APP_ID ?? "";
}

export function getMetaAppSecret(): string {
  return process.env.META_APP_SECRET ?? "";
}

/** Booking.com Affiliate - user stores their affiliate ID */
export function getBookingAffiliateDefault(): string {
  return process.env.BOOKING_AFFILIATE_ID ?? "";
}
