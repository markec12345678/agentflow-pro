import Redis from 'ioredis';
import { logger } from '@/infrastructure/observability/logger';

export interface CachedResponse {
  data: any;
  timestamp: number;
  ttl: number;
  metadata: {
    agentId: string;
    inputHash: string;
    executionTime: number;
  };
}

export class AgentCache {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour
  private maxTTL = 86400; // 24 hours

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    });

    // Handle connection errors
    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  async getCachedResponse(key: string): Promise<CachedResponse | null> {
    try {
      const cachedData = await this.redis.get(key);
      if (!cachedData) return null;

      const parsed = JSON.parse(cachedData) as CachedResponse;

      // Check if cache is still valid
      if (Date.now() > parsed.timestamp + parsed.ttl * 1000) {
        await this.redis.del(key);
        return null;
      }

      return parsed;
    } catch (error) {
      logger.error('Cache read error:', error);
      return null;
    }
  }

  async setCachedResponse(
    key: string,
    data: any,
    ttl: number = this.defaultTTL,
    metadata: Partial<CachedResponse['metadata']> = {}
  ): Promise<void> {
    try {
      const cacheEntry: CachedResponse = {
        data,
        timestamp: Date.now(),
        ttl: Math.min(ttl, this.maxTTL),
        metadata: {
          agentId: metadata.agentId || 'unknown',
          inputHash: metadata.inputHash || '',
          executionTime: metadata.executionTime || 0,
        }
      };

      await this.redis.set(key, JSON.stringify(cacheEntry), 'EX', ttl);
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }

  async invalidateCache(pattern: string): Promise<void> {
    try {
      // Note: Redis keys command should be used carefully in production
      const keys = await this.redis.keys(`${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  async getCacheStats(): Promise<{
    hitRate: number;
    memoryUsage: number;
    keysCount: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keysCount = await this.redis.dbsize();

      // In a real implementation, you'd track hit rate separately
      return {
        hitRate: 0.85, // Mock value
        memoryUsage: this.extractMemoryUsage(info),
        keysCount
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        hitRate: 0,
        memoryUsage: 0,
        keysCount: 0
      };
    }
  }

  private extractMemoryUsage(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }

  // Smart caching methods
  async smartCache(
    agentId: string,
    input: any,
    fetchFn: () => Promise<any>,
    ttl: number = this.defaultTTL
  ): Promise<{ data: any; source: 'cache' | 'fresh' }> {
    const inputHash = this.hashInput(input);
    const cacheKey = `agent:${agentId}:${inputHash}`;

    // Try to get from cache first
    const cached = await this.getCachedResponse(cacheKey);
    if (cached) {
      return { data: cached.data, source: 'cache' };
    }

    // Fresh execution
    const startTime = Date.now();
    const data = await fetchFn();
    const executionTime = Date.now() - startTime;

    // Cache the result
    await this.setCachedResponse(cacheKey, data, ttl, {
      agentId,
      inputHash,
      executionTime
    });

    return { data, source: 'fresh' };
  }

  private hashInput(input: any): string {
    return require('crypto').createHash('md5').update(JSON.stringify(input)).digest('hex');
  }

  // Cache warming
  async warmCache(agentId: string, sampleInputs: any[]): Promise<void> {
    for (const input of sampleInputs) {
      try {
        const inputHash = this.hashInput(input);
        const cacheKey = `agent:${agentId}:${inputHash}`;

        // Check if already cached
        const exists = await this.redis.exists(cacheKey);
        if (exists) continue;

        // Execute and cache
        // Note: In a real app, you'd have the actual agent execution here
        const mockData = { warmed: true, input, agentId };
        await this.setCachedResponse(cacheKey, mockData, this.defaultTTL * 2);
      } catch (error) {
        logger.error(`Cache warming failed for ${agentId}:`, error);
      }
    }
  }
}

// Singleton instance
let cacheInstance: AgentCache | null = null;

export function getAgentCache(): AgentCache {
  if (!cacheInstance) {
    cacheInstance = new AgentCache();
  }
  return cacheInstance;
}
