/**
 * AgentFlow Pro - Redis Context Caching
 * 
 * Provides cached context retrieval for FAQ and other tourism APIs.
 * Caches expensive operations like guest retrieval, policy checks, and context building.
 * 
 * Features:
 * - Automatic TTL management
 * - Cache invalidation on updates
 * - Fallback to uncached execution
 * - Performance metrics tracking
 */

import { getRedisClient } from '@/lib/redis';

export interface CachedContext<T = any> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  version: string;
}

export interface CacheOptions {
  ttl?: number; // seconds
  version?: string;
  tags?: string[];
}

const DEFAULT_TTL = 300; // 5 minutes
const CACHE_VERSION = 'v1';

/**
 * Generate cache key from context
 */
function generateCacheKey(prefix: string, context: Record<string, any>): string {
  const sorted = Object.keys(context)
    .sort()
    .map(key => `${key}:${context[key]}`)
    .join('|');
  
  return `context:${prefix}:${CACHE_VERSION}:${sorted}`;
}

/**
 * Get cached context
 * Returns null if not found or expired
 */
export async function getCachedContext<T = any>(
  prefix: string,
  context: Record<string, any>
): Promise<T | null> {
  const redis = getRedisClient();
  
  if (!redis) {
    console.log('[Cache] Redis not available, skipping cache');
    return null;
  }

  try {
    const cacheKey = generateCacheKey(prefix, context);
    const cachedData = await redis.get(cacheKey);

    if (!cachedData) {
      return null;
    }

    const parsed: CachedContext<T> = JSON.parse(cachedData);
    
    // Check if expired
    if (Date.now() > parsed.expiresAt) {
      await redis.del(cacheKey);
      return null;
    }

    console.log(`[Cache] HIT: ${cacheKey}`);
    return parsed.data;
  } catch (error) {
    console.error('[Cache] Error getting cached context:', error);
    return null;
  }
}

/**
 * Set cached context
 */
export async function setCachedContext<T = any>(
  prefix: string,
  context: Record<string, any>,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis) {
    console.log('[Cache] Redis not available, skipping cache set');
    return;
  }

  try {
    const ttl = options.ttl || DEFAULT_TTL;
    const cacheKey = generateCacheKey(prefix, context);
    
    const cachedContext: CachedContext<T> = {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000),
      version: options.version || CACHE_VERSION,
    };

    await redis.setex(cacheKey, ttl, JSON.stringify(cachedContext));
    
    // Add to tags index if provided
    if (options.tags) {
      for (const tag of options.tags) {
        await redis.sadd(`cache:tags:${tag}`, cacheKey);
        await redis.expire(`cache:tags:${tag}`, ttl);
      }
    }

    console.log(`[Cache] SET: ${cacheKey} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('[Cache] Error setting cached context:', error);
  }
}

/**
 * Invalidate cached contexts by tag
 */
export async function invalidateCachedContext(
  prefix: string,
  context: Record<string, any>
): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis) {
    return;
  }

  try {
    const cacheKey = generateCacheKey(prefix, context);
    await redis.del(cacheKey);
    console.log(`[Cache] INVALIDATED: ${cacheKey}`);
  } catch (error) {
    console.error('[Cache] Error invalidating context:', error);
  }
}

/**
 * Invalidate all cached contexts with a specific tag
 */
export async function invalidateCachedContextByTag(tag: string): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis) {
    return;
  }

  try {
    const cacheKeys = await redis.smembers(`cache:tags:${tag}`);
    
    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
      await redis.del(`cache:tags:${tag}`);
      console.log(`[Cache] INVALIDATED ${cacheKeys.length} keys with tag: ${tag}`);
    }
  } catch (error) {
    console.error('[Cache] Error invalidating by tag:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  memoryUsage?: string;
  hitRate?: number;
}> {
  const redis = getRedisClient();
  
  if (!redis) {
    return { totalKeys: 0 };
  }

  try {
    const keys = await redis.keys('context:*');
    const memoryInfo = await redis.info('memory');
    
    return {
      totalKeys: keys.length,
      memoryUsage: memoryInfo,
    };
  } catch (error) {
    console.error('[Cache] Error getting stats:', error);
    return { totalKeys: 0 };
  }
}

/**
 * Clear all cached contexts
 */
export async function clearAllCachedContexts(): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis) {
    return;
  }

  try {
    const keys = await redis.keys('context:*');
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] CLEARED ${keys.length} context keys`);
    }
  } catch (error) {
    console.error('[Cache] Error clearing all contexts:', error);
  }
}

/**
 * Cache wrapper for expensive operations
 */
export async function withCache<T>(
  prefix: string,
  context: Record<string, any>,
  operation: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache
  const cached = await getCachedContext<T>(prefix, context);
  
  if (cached !== null) {
    return cached;
  }

  // Execute operation and cache result
  const result = await operation();
  await setCachedContext(prefix, context, result, options);
  
  return result;
}
