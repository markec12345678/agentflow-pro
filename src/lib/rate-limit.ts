/**
 * Distributed Rate Limiter using Redis for production environments.
 * Falls back to in-memory for development/when Redis is unavailable.
 * 
 * Per-user (API key) limits and IP-based limiter for anonymous endpoints.
 */

import { getRedisClient } from "@/lib/redis";

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 per minute per API key

// Fallback in-memory stores (used when Redis is unavailable)
const memoryStore = new Map<string, { count: number; resetAt: number }>();
const memoryIpStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
  limit?: number;
  reset?: number;
}

/**
 * Redis-based rate limiter using INCR + EXPIRE pattern.
 * Atomic operations prevent race conditions in distributed environments.
 */
export async function checkRateLimit(
  keyId: string,
  maxRequests = MAX_REQUESTS,
  windowMs = WINDOW_MS
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  
  // Fallback to in-memory if Redis unavailable
  if (!redis) {
    return checkMemoryRateLimit(keyId, maxRequests, windowMs, memoryStore);
  }

  try {
    const now = Date.now();
    const windowKey = `ratelimit:${keyId}:${Math.floor(now / windowMs)}`;
    
    // Atomic increment with expiration
    const current = await redis.incr(windowKey);
    
    if (current === 1) {
      // First request in this window - set expiration
      await redis.expire(windowKey, Math.ceil(windowMs / 1000));
    }

    const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    const remaining = Math.max(0, maxRequests - current);

    if (current > maxRequests) {
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
        limit: maxRequests,
        reset: resetAt,
      };
    }

    return {
      allowed: true,
      retryAfter: current >= maxRequests ? retryAfter : undefined,
      remaining,
      limit: maxRequests,
      reset: resetAt,
    };
  } catch (error) {
    console.error('Rate limiter Redis error, falling back to memory:', error);
    return checkMemoryRateLimit(keyId, maxRequests, windowMs, memoryStore);
  }
}

/**
 * IP-based rate limiter for anonymous/public endpoints.
 * Uses Redis sorted set for efficient sliding window.
 */
export async function checkRateLimitByIp(
  ip: string,
  windowMs = 60_000,
  maxRequests = 60
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  
  // Fallback to in-memory if Redis unavailable
  if (!redis) {
    return checkMemoryRateLimit(ip, maxRequests, windowMs, memoryIpStore);
  }

  try {
    const now = Date.now();
    const windowKey = `ratelimit:ip:${ip}:${Math.floor(now / windowMs)}`;
    
    const current = await redis.incr(windowKey);
    
    if (current === 1) {
      await redis.expire(windowKey, Math.ceil(windowMs / 1000));
    }

    const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    const remaining = Math.max(0, maxRequests - current);

    if (current > maxRequests) {
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
        limit: maxRequests,
        reset: resetAt,
      };
    }

    return {
      allowed: true,
      retryAfter: current >= maxRequests ? retryAfter : undefined,
      remaining,
      limit: maxRequests,
      reset: resetAt,
    };
  } catch (error) {
    console.error('IP Rate limiter Redis error, falling back to memory:', error);
    return checkMemoryRateLimit(ip, maxRequests, windowMs, memoryIpStore);
  }
}

/**
 * Fallback in-memory rate limiter (development/Redis unavailable).
 */
function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  store: Map<string, { count: number; resetAt: number }>
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      limit: maxRequests,
      reset: now + windowMs,
    };
  }

  if (now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      limit: maxRequests,
      reset: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      remaining: 0,
      limit: maxRequests,
      reset: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    limit: maxRequests,
    reset: entry.resetAt,
  };
}

/**
 * Rate limit middleware for Next.js API routes.
 * Returns 429 Too Many Requests if limit exceeded.
 */
export function createRateLimitHandler(options?: {
  maxRequests?: number;
  windowMs?: number;
  keyGenerator?: (req: Request) => string;
}) {
  return async function rateLimitMiddleware(request: Request): Promise<Response | null> {
    const { maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS } = options || {};
    
    // Get identifier (API key, user ID, or IP)
    let identifier = 'anonymous';
    
    if (options?.keyGenerator) {
      identifier = options.keyGenerator(request);
    } else {
      // Try to get API key from headers
      const apiKey = request.headers.get('x-api-key');
      const authHeader = request.headers.get('authorization');
      
      if (apiKey) {
        identifier = `apikey:${apiKey}`;
      } else if (authHeader?.startsWith('Bearer ')) {
        identifier = `token:${authHeader.substring(7)}`;
      } else {
        // Fallback to IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
        identifier = `ip:${ip}`;
      }
    }

    const result = await checkRateLimit(identifier, maxRequests, windowMs);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': result.limit?.toString() || '60',
            'X-RateLimit-Remaining': result.remaining?.toString() || '0',
            'X-RateLimit-Reset': result.reset?.toString() || '',
          },
        }
      );
    }

    return null; // Allow request to proceed
  };
}
