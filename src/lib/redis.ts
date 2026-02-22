/**
 * AgentFlow Pro - Redis client singleton
 * Used for conversation context and session caching.
 * Gracefully returns null when REDIS_URL is not set.
 */

import Redis from "ioredis";

let _client: Redis | null = null;

export function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url?.trim()) return null;
  if (_client) return _client;
  try {
    _client = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times <= 2 ? 500 : null),
    });
    return _client;
  } catch {
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
