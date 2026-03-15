/**
 * AgentFlow Pro - Redis client singleton
 * Uses Upstash Redis (serverless) for production.
 * Gracefully returns null when REDIS_URL is not set.
 */

import { Redis } from "@upstash/redis";
import { logger } from '@/infrastructure/observability/logger';

let _client: Redis | null = null;

export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  // Return null if URL or token is missing
  if (!url?.trim() || !token?.trim()) {
    return null;
  }
  
  if (_client) return _client;
  
  try {
    // Use Upstash Redis (serverless HTTP-based Redis)
    _client = new Redis({
      url: url,
      token: token,
    });
    return _client;
  } catch (error) {
    logger.error('[Redis] Failed to initialize:', error);
    return null;
  }
}

export async function getCachedContext<T>(
  key: string,
  _ttlSeconds = 300
): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCachedContext<T>(
  key: string,
  value: T,
  ttlSeconds = 300
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/**
 * API Response Caching Helper
 * Caches API responses with automatic invalidation support.
 */
export interface CachedResponse<T> {
  data: T;
  timestamp: number;
  tags?: string[];
}

export async function getCachedResponse<T>(
  key: string
): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const cached = await redis.get(`api:${key}`);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached) as CachedResponse<T>;
    
    // Check if cache is still valid (max 1 hour)
    const maxAge = 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > maxAge) {
      await redis.del(`api:${key}`);
      return null;
    }
    
    return parsed.data;
  } catch {
    return null;
  }
}

export async function setCachedResponse<T>(
  key: string,
  data: T,
  ttlSeconds = 300,
  tags?: string[]
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    const cached: CachedResponse<T> = {
      data,
      timestamp: Date.now(),
      tags,
    };
    
    await redis.setex(`api:${key}`, ttlSeconds, JSON.stringify(cached));
    
    // Store tags for invalidation
    if (tags?.length) {
      for (const tag of tags) {
        await redis.sadd(`api:tags:${tag}`, `api:${key}`);
        await redis.expire(`api:tags:${tag}`, ttlSeconds);
      }
    }
  } catch {
    /* ignore */
  }
}

export async function invalidateCachedResponse(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    await redis.del(`api:${key}`);
  } catch {
    /* ignore */
  }
}

export async function invalidateCachedByTag(tag: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    const keys = await redis.smembers(`api:tags:${tag}`);
    if (keys.length) {
      await redis.del(...keys);
      await redis.del(`api:tags:${tag}`);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Cache wrapper for API route handlers
 */
export async function withCache<T>(
  key: string,
  handler: () => Promise<T>,
  ttlSeconds = 300,
  tags?: string[]
): Promise<T> {
  // Try to get from cache
  const cached = await getCachedResponse<T>(key);
  if (cached) {
    return cached;
  }
  
  // Execute handler and cache result
  const data = await handler();
  await setCachedResponse(key, data, ttlSeconds, tags);
  
  return data;
}
