/**
 * Simple in-memory rate limiter for Public API.
 * Per-user (API key) limits. Resets every windowMs.
 */

const store = new Map<
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
