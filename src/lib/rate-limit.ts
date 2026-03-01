/**
 * Simple in-memory rate limiter for Public API.
 * Per-user (API key) limits. Resets every windowMs.
 * IP-based limiter for anonymous endpoints (e.g. FAQ POST).
 */

const store = new Map<
  string,
  { count: number; resetAt: number }
>();

const ipStore = new Map<
  string,
  { count: number; resetAt: number }
>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 per minute per API key

export function checkRateLimit(keyId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(keyId);

  if (!entry) {
    store.set(keyId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (now >= entry.resetAt) {
    store.set(keyId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * IP-based rate limiter for anonymous/public endpoints (e.g. /api/tourism/faq POST).
 * Default: 60 requests per minute per IP.
 */
export function checkRateLimitByIp(
  ip: string,
  windowMs = 60_000,
  maxRequests = 60
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = ipStore.get(ip);

  if (!entry) {
    ipStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (now >= entry.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}
