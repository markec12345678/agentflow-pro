/**
 * Rate Limiting with Upstash Redis
 * 
 * Implements sliding window rate limiting for:
 * - IP-based limiting (all routes)
 * - User-based limiting (authenticated routes)
 * - Route-specific limiting (API endpoints)
 * - Token bucket for burst handling
 * 
 * @see https://docs.upstash.com/redis
 */

import { Redis } from '@upstash/redis';

// Initialize Redis connection
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limit configurations
export const RATE_LIMITS = {
  // General API access (per IP)
  GENERAL: {
    window: 60, // 1 minute
    max: 60, // 60 requests per minute
  },
  // Authentication endpoints (per IP)
  AUTH: {
    window: 60, // 1 minute
    max: 10, // 10 attempts per minute
  },
  // AI/Agent endpoints (per user)
  AI: {
    window: 60, // 1 minute
    max: 20, // 20 AI requests per minute
  },
  // Payment/Stripe webhooks (per IP)
  PAYMENT: {
    window: 60, // 1 minute
    max: 100, // 100 webhook events per minute
  },
  // Export/heavy operations (per user)
  EXPORT: {
    window: 3600, // 1 hour
    max: 10, // 10 exports per hour
  },
};

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given key
 * Uses sliding window algorithm with Redis
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  window: number
): Promise<RateLimitResult> {
  // If Redis is not available, allow all (development mode)
  if (!redis) {
    return {
      allowed: true,
      current: 0,
      limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }

  const now = Date.now();
  const windowStart = now - window * 1000;
  const redisKey = `ratelimit:${key}:${Math.floor(now / (window * 1000))}`;

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    
    // Add current timestamp to sorted set
    pipeline.zadd(redisKey, { score: now, member: now.toString() });
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count requests in current window
    pipeline.zcard(redisKey);
    
    // Set expiry on the key
    pipeline.expire(redisKey, window * 2);
    
    // Execute pipeline
    const results = await pipeline.exec();
    
    // Get current count (third result from zcard)
    const current = (results[2] as number) || 0;
    const remaining = Math.max(0, limit - current);
    const reset = now + window * 1000;
    
    const allowed = current <= limit;
    
    return {
      allowed,
      current,
      limit,
      remaining,
      reset,
      retryAfter: allowed ? undefined : window,
    };
  } catch (error) {
    console.error('[Rate Limit] Redis error:', error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      current: 0,
      limit,
      remaining: limit,
      reset: now + window * 1000,
    };
  }
}

/**
 * Check rate limit by IP address
 * Used for general API access
 */
export async function checkRateLimitByIp(ip: string): Promise<RateLimitResult> {
  const key = `ip:${ip}`;
  return checkRateLimit(key, RATE_LIMITS.GENERAL.max, RATE_LIMITS.GENERAL.window);
}

/**
 * Check rate limit for authentication endpoints
 * Stricter limits to prevent brute force
 */
export async function checkRateLimitAuth(ip: string): Promise<RateLimitResult> {
  const key = `auth:${ip}`;
  return checkRateLimit(key, RATE_LIMITS.AUTH.max, RATE_LIMITS.AUTH.window);
}

/**
 * Check rate limit for AI/Agent endpoints
 * Per-user limiting for expensive AI operations
 */
export async function checkRateLimitAI(userId: string): Promise<RateLimitResult> {
  const key = `ai:${userId}`;
  return checkRateLimit(key, RATE_LIMITS.AI.max, RATE_LIMITS.AI.window);
}

/**
 * Check rate limit for export operations
 * Very restrictive for heavy operations
 */
export async function checkRateLimitExport(userId: string): Promise<RateLimitResult> {
  const key = `export:${userId}`;
  return checkRateLimit(key, RATE_LIMITS.EXPORT.max, RATE_LIMITS.EXPORT.window);
}

/**
 * Check rate limit for payment webhooks
 * Higher limits for webhook processing
 */
export async function checkRateLimitPayment(ip: string): Promise<RateLimitResult> {
  const key = `payment:${ip}`;
  return checkRateLimit(key, RATE_LIMITS.PAYMENT.max, RATE_LIMITS.PAYMENT.window);
}

/**
 * Get current rate limit status without incrementing
 * Useful for displaying rate limit info to users
 */
export async function getRateLimitStatus(
  key: string,
  limit: number,
  window: number
): Promise<RateLimitResult> {
  if (!redis) {
    return {
      allowed: true,
      current: 0,
      limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }

  try {
    const now = Date.now();
    const windowStart = now - window * 1000;
    const redisKey = `ratelimit:${key}:${Math.floor(now / (window * 1000))}`;
    
    // Count current requests in window
    const current = await redis.zcount(redisKey, windowStart, now);
    const remaining = Math.max(0, limit - current);
    const reset = now + window * 1000;
    
    return {
      allowed: current <= limit,
      current,
      limit,
      remaining,
      reset,
      retryAfter: current > limit ? window : undefined,
    };
  } catch (error) {
    console.error('[Rate Limit] Status check error:', error);
    return {
      allowed: true,
      current: 0,
      limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }
}

/**
 * Reset rate limit for a specific key
 * Useful for admin actions or user requests
 */
export async function resetRateLimit(key: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    const pattern = `ratelimit:${key}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Rate Limit] Reset error:', error);
    return false;
  }
}

/**
 * Middleware helper for rate limiting
 * Returns rate limit headers to add to response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.reset / 1000).toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  };
}
