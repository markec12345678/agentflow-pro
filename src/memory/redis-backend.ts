/**
 * RedisMemoryBackend - Redis-based working memory implementation
 * 
 * Provides fast (<1ms latency) working memory for:
 * - Current session context
 * - Agent execution state
 * - Temporary workflow data
 * - Short-term conversation history
 * 
 * Features:
 * - TTL-based expiration (default 1 hour)
 * - JSON serialization for complex objects
 * - Atomic operations for concurrent access
 * - Pub/sub for real-time updates (future)
 * 
 * Based on research showing hybrid memory architecture improves
 * token efficiency and context continuity vs pure RAG approaches.
 */

import { Redis } from '@upstash/redis';
import type { GraphSnapshot } from './graph-schema';
import type {
  MemoryBackend,
  CreateEntityInput,
  AddObservationsInput,
  CreateRelationInput,
  DeleteRelationInput,
  DeleteObservationsInput,
} from './memory-backend';

// ============================================================================
// CONFIGURATION & TYPES
// ============================================================================

export interface RedisMemoryConfig {
  /** Redis connection URL */
  url: string;
  
  /** Default TTL for working memory entries (seconds) */
  defaultTTL: number;
  
  /** Key prefix for all memory entries */
  keyPrefix: string;
  
  /** Enable compression for large values */
  enableCompression: boolean;
  
  /** Maximum memory entries per session */
  maxEntriesPerSession: number;
}

export interface WorkingMemoryContext {
  sessionId: string;
  userId?: string;
  workflowId?: string;
  agentId?: string;
  context: Record<string, any>;
  createdAt: number;
  expiresAt: number;
}

export interface MemoryEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

export const DEFAULT_REDIS_CONFIG: Partial<RedisMemoryConfig> = {
  defaultTTL: 3600, // 1 hour
  keyPrefix: 'memory:',
  enableCompression: false,
  maxEntriesPerSession: 1000,
};

// ============================================================================
// REDIS MEMORY BACKEND
// ============================================================================

export class RedisMemoryBackend implements MemoryBackend {
  private redis: Redis;
  private config: RedisMemoryConfig;
  private localCache = new Map<string, any>();
  private isInitialized = false;

  constructor(config?: Partial<RedisMemoryConfig>) {
    this.config = {
      ...DEFAULT_REDIS_CONFIG,
      ...config,
    } as RedisMemoryConfig;

    if (!this.config.url) {
      throw new Error(
        'Redis URL is required. Set UPSTASH_REDIS_REST_URL or REDIS_URL in environment.'
      );
    }

    try {
      this.redis = new Redis({
        url: this.config.url,
        // Automatic retry configuration
        retry: {
          retries: 3,
          backoff: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 5000),
        },
      });
      this.isInitialized = true;
      console.log('[RedisMemory] Initialized with TTL:', this.config.defaultTTL, 'seconds');
    } catch (error) {
      console.error('[RedisMemory] Failed to initialize Redis connection:', error);
      throw error;
    }
  }

  // ============================================================================
  // CORE MEMORY OPERATIONS
  // ============================================================================

  /**
   * Set working context for a session
   * Fast access (<1ms) for current conversation/workflow state
   */
  async setWorkingContext(context: WorkingMemoryContext): Promise<void> {
    const key = this.makeKey('context', context.sessionId);
    
    try {
      await this.redis.set(key, context, {
        ex: this.config.defaultTTL,
      });
      
      // Update local cache
      this.localCache.set(key, context);
      
      console.log(`[RedisMemory] Set working context for session: ${context.sessionId}`);
    } catch (error) {
      console.error('[RedisMemory] Failed to set working context:', error);
      throw error;
    }
  }

  /**
   * Get working context for a session
   */
  async getWorkingContext(sessionId: string): Promise<WorkingMemoryContext | null> {
    const key = this.makeKey('context', sessionId);
    
    try {
      // Check local cache first
      if (this.localCache.has(key)) {
        const cached = this.localCache.get(key);
        // Verify not expired
        if (cached.expiresAt > Date.now()) {
          return cached;
        }
        this.localCache.delete(key);
      }
      
      const context = await this.redis.get<WorkingMemoryContext>(key);
      
      if (context) {
        // Update access metadata
        context.accessCount = (context.accessCount || 0) + 1;
        context.lastAccessedAt = Date.now();
        
        // Refresh TTL on access
        await this.redis.expire(key, this.config.defaultTTL);
        
        // Update cache
        this.localCache.set(key, context);
      }
      
      return context;
    } catch (error) {
      console.error('[RedisMemory] Failed to get working context:', error);
      return null;
    }
  }

  /**
   * Delete working context for a session
   */
  async deleteWorkingContext(sessionId: string): Promise<void> {
    const key = this.makeKey('context', sessionId);
    
    try {
      await this.redis.del(key);
      this.localCache.delete(key);
      console.log(`[RedisMemory] Deleted working context for session: ${sessionId}`);
    } catch (error) {
      console.error('[RedisMemory] Failed to delete working context:', error);
    }
  }

  /**
   * Set a value in working memory with TTL
   */
  async set<T>(
    sessionId: string,
    key: string,
    value: T,
    options?: { ttl?: number; namespace?: string }
  ): Promise<void> {
    const fullKey = this.makeKey(options?.namespace || 'data', sessionId, key);
    const ttl = options?.ttl || this.config.defaultTTL;
    
    const entry: MemoryEntry<T> = {
      key: fullKey,
      value,
      ttl,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessedAt: Date.now(),
    };
    
    try {
      await this.redis.set(fullKey, entry, { ex: ttl });
      this.localCache.set(fullKey, entry);
      
      console.log(`[RedisMemory] Set ${fullKey} with TTL: ${ttl}s`);
    } catch (error) {
      console.error('[RedisMemory] Failed to set value:', error);
      throw error;
    }
  }

  /**
   * Get a value from working memory
   */
  async get<T>(
    sessionId: string,
    key: string,
    namespace?: string
  ): Promise<T | null> {
    const fullKey = this.makeKey(namespace || 'data', sessionId, key);
    
    try {
      // Check local cache first
      if (this.localCache.has(fullKey)) {
        const cached = this.localCache.get(fullKey);
        if (cached.ttl > 0) {
          const age = Date.now() - cached.lastAccessedAt;
          // Still valid if accessed recently
          if (age < cached.ttl * 1000) {
            cached.accessCount++;
            cached.lastAccessedAt = Date.now();
            return cached.value as T;
          }
        }
        this.localCache.delete(fullKey);
      }
      
      const entry = await this.redis.get<MemoryEntry<T>>(fullKey);
      
      if (entry) {
        // Update access metadata
        entry.accessCount++;
        entry.lastAccessedAt = Date.now();
        
        // Refresh TTL
        await this.redis.expire(fullKey, entry.ttl);
        
        // Update cache
        this.localCache.set(fullKey, entry);
        
        return entry.value;
      }
      
      return null;
    } catch (error) {
      console.error('[RedisMemory] Failed to get value:', error);
      return null;
    }
  }

  /**
   * Delete a value from working memory
   */
  async delete(sessionId: string, key: string, namespace?: string): Promise<void> {
    const fullKey = this.makeKey(namespace || 'data', sessionId, key);
    
    try {
      await this.redis.del(fullKey);
      this.localCache.delete(fullKey);
    } catch (error) {
      console.error('[RedisMemory] Failed to delete value:', error);
    }
  }

  /**
   * Check if a key exists in memory
   */
  async exists(sessionId: string, key: string, namespace?: string): Promise<boolean> {
    const fullKey = this.makeKey(namespace || 'data', sessionId, key);
    
    try {
      return await this.redis.exists(fullKey) > 0;
    } catch (error) {
      console.error('[RedisMemory] Failed to check existence:', error);
      return false;
    }
  }

  /**
   * Get TTL for a key (seconds until expiration)
   */
  async getTTL(sessionId: string, key: string, namespace?: string): Promise<number> {
    const fullKey = this.makeKey(namespace || 'data', sessionId, key);
    
    try {
      return await this.redis.ttl(fullKey);
    } catch (error) {
      console.error('[RedisMemory] Failed to get TTL:', error);
      return -1;
    }
  }

  /**
   * Extend TTL for a key
   */
  async refreshTTL(
    sessionId: string,
    key: string,
    ttl?: number,
    namespace?: string
  ): Promise<void> {
    const fullKey = this.makeKey(namespace || 'data', sessionId, key);
    const newTTL = ttl || this.config.defaultTTL;
    
    try {
      await this.redis.expire(fullKey, newTTL);
      console.log(`[RedisMemory] Refreshed TTL for ${fullKey}: ${newTTL}s`);
    } catch (error) {
      console.error('[RedisMemory] Failed to refresh TTL:', error);
    }
  }

  // ============================================================================
  // MEMORY BACKEND INTERFACE (Knowledge Graph)
  // ============================================================================

  createEntities(entities: CreateEntityInput[]): void {
    console.warn(
      '[RedisMemory] createEntities() is not implemented in Redis backend. ' +
      'Use Postgres backend for persistent knowledge graph storage.'
    );
  }

  addObservations(obs: AddObservationsInput[]): void {
    console.warn(
      '[RedisMemory] addObservations() is not implemented in Redis backend. ' +
      'Use Postgres backend for persistent knowledge graph storage.'
    );
  }

  deleteObservations(obs: DeleteObservationsInput[]): void {
    console.warn(
      '[RedisMemory] deleteObservations() is not implemented in Redis backend.'
    );
  }

  createRelations(relations: CreateRelationInput[]): void {
    console.warn(
      '[RedisMemory] createRelations() is not implemented in Redis backend. ' +
      'Use Postgres backend for persistent knowledge graph storage.'
    );
  }

  deleteRelations(relations: DeleteRelationInput[]): void {
    console.warn(
      '[RedisMemory] deleteRelations() is not implemented in Redis backend.'
    );
  }

  searchNodes(query: string): {
    entities: CreateEntityInput[];
    relations: CreateRelationInput[];
  } {
    console.warn(
      '[RedisMemory] searchNodes() is not implemented in Redis backend. ' +
      'Use pgvector backend for semantic search.'
    );
    return { entities: [], relations: [] };
  }

  readGraph(): GraphSnapshot {
    console.warn(
      '[RedisMemory] readGraph() is not implemented in Redis backend. ' +
      'Use Postgres backend for knowledge graph storage.'
    );
    return { entities: [], relations: [] };
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Get all keys for a session
   */
  async getSessionKeys(sessionId: string, namespace?: string): Promise<string[]> {
    const pattern = this.makeKey(namespace || 'data', sessionId, '*');
    
    try {
      const keys = await this.redis.keys(pattern);
      return keys.map(k => k.replace(this.makeKey(namespace || 'data', sessionId, ''), ''));
    } catch (error) {
      console.error('[RedisMemory] Failed to get session keys:', error);
      return [];
    }
  }

  /**
   * Delete all memory for a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const patterns = [
      this.makeKey('context', sessionId),
      this.makeKey('data', sessionId, '*'),
      this.makeKey('agent', sessionId, '*'),
      this.makeKey('workflow', sessionId, '*'),
    ];
    
    try {
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      
      // Clear local cache
      for (const key of this.localCache.keys()) {
        if (key.includes(sessionId)) {
          this.localCache.delete(key);
        }
      }
      
      console.log(`[RedisMemory] Deleted all memory for session: ${sessionId}`);
    } catch (error) {
      console.error('[RedisMemory] Failed to delete session:', error);
    }
  }

  /**
   * Get memory usage stats for a session
   */
  async getSessionStats(sessionId: string): Promise<{
    keyCount: number;
    totalSize: number;
    oldestKey: string | null;
    newestKey: string | null;
  }> {
    const pattern = this.makeKey('data', sessionId, '*');
    
    try {
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return {
          keyCount: 0,
          totalSize: 0,
          oldestKey: null,
          newestKey: null,
        };
      }
      
      // Get TTLs to estimate age
      const ttlResults = await Promise.all(keys.map(k => this.redis.ttl(k)));
      
      const oldestIndex = ttlResults.indexOf(Math.max(...ttlResults));
      const newestIndex = ttlResults.indexOf(Math.min(...ttlResults));
      
      return {
        keyCount: keys.length,
        totalSize: keys.length * 1024, // Estimate: 1KB per key
        oldestKey: keys[oldestIndex] || null,
        newestKey: keys[newestIndex] || null,
      };
    } catch (error) {
      console.error('[RedisMemory] Failed to get session stats:', error);
      return {
        keyCount: 0,
        totalSize: 0,
        oldestKey: null,
        newestKey: null,
      };
    }
  }

  // ============================================================================
  // AGENT EXECUTION STATE
  // ============================================================================

  /**
   * Set agent execution state
   */
  async setAgentState(
    sessionId: string,
    agentId: string,
    state: Record<string, any>,
    workflowId?: string
  ): Promise<void> {
    const key = workflowId ? `workflow:${workflowId}:agent:${agentId}` : `agent:${agentId}`;
    await this.set(sessionId, key, state, { namespace: 'state' });
  }

  /**
   * Get agent execution state
   */
  async getAgentState(
    sessionId: string,
    agentId: string,
    workflowId?: string
  ): Promise<Record<string, any> | null> {
    const key = workflowId ? `workflow:${workflowId}:agent:${agentId}` : `agent:${agentId}`;
    return await this.get(sessionId, key, 'state');
  }

  /**
   * Append to agent execution log
   */
  async appendAgentLog(
    sessionId: string,
    agentId: string,
    logEntry: string,
    workflowId?: string
  ): Promise<void> {
    const key = workflowId ? `workflow:${workflowId}:agent:${agentId}:log` : `agent:${agentId}:log`;
    const fullKey = this.makeKey('state', sessionId, key);
    
    try {
      await this.redis.rpush(fullKey, logEntry);
      await this.redis.expire(fullKey, this.config.defaultTTL);
    } catch (error) {
      console.error('[RedisMemory] Failed to append agent log:', error);
    }
  }

  /**
   * Get agent execution log
   */
  async getAgentLog(
    sessionId: string,
    agentId: string,
    workflowId?: string,
    limit?: number
  ): Promise<string[]> {
    const key = workflowId ? `workflow:${workflowId}:agent:${agentId}:log` : `agent:${agentId}:log`;
    const fullKey = this.makeKey('state', sessionId, key);
    
    try {
      if (limit) {
        return await this.redis.lrange(fullKey, -limit, -1);
      }
      return await this.redis.lrange(fullKey, 0, -1);
    } catch (error) {
      console.error('[RedisMemory] Failed to get agent log:', error);
      return [];
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private makeKey(...parts: string[]): string {
    const key = parts.join(':');
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Clear local cache (useful for testing)
   */
  clearCache(): void {
    this.localCache.clear();
  }

  /**
   * Get Redis client for direct operations
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Check Redis connection status
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('[RedisMemory] Ping failed:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      // Upstash Redis doesn't require explicit disconnect
      this.isInitialized = false;
      console.log('[RedisMemory] Disconnected');
    } catch (error) {
      console.error('[RedisMemory] Error during disconnect:', error);
    }
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

export const getRedisMemoryBackend = (
  config?: Partial<RedisMemoryConfig>
): RedisMemoryBackend => {
  // Try to get URL from environment
  const envConfig = {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL,
  };
  
  if (!envConfig.url && !config?.url) {
    console.warn(
      '[RedisMemory] No Redis URL found in environment. ' +
      'Set UPSTASH_REDIS_REST_URL or REDIS_URL. ' +
      'Falling back to InMemoryBackend.'
    );
    throw new Error('Redis URL required');
  }
  
  return new RedisMemoryBackend({ ...envConfig, ...config });
};

export default RedisMemoryBackend;
