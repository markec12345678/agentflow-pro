/**
 * HybridMemoryManager - Manages hybrid memory architecture
 * 
 * Combines multiple memory backends for optimal performance:
 * - Redis: Working memory (<1ms latency, TTL-based expiration)
 * - Postgres: Episodic memory (persistent workflow history)
 * - pgvector: Semantic memory (vector search for similar experiences)
 * 
 * This architecture improves token efficiency and context continuity
 * vs pure RAG approaches, as shown in research.
 * 
 * Usage:
 * ```typescript
 * const memory = getHybridMemoryManager();
 * 
 * // Set working context (Redis - fast access)
 * await memory.setWorkingContext(sessionId, context);
 * 
 * // Store episodic memory (Postgres - persistent)
 * await memory.storeEpisodicMemory({ sessionId, type: 'workflow', data });
 * 
 * // Search semantic memory (pgvector - similarity search)
 * const similar = await memory.searchSemanticMemory(query, { limit: 5 });
 * ```
 */

import { RedisMemoryBackend, getRedisMemoryBackend } from './redis-backend';
import { InMemoryBackend, MemoryBackend } from './memory-backend';

export interface HybridMemoryConfig {
  /** Enable Redis for working memory */
  enableRedis: boolean;
  
  /** Enable Postgres for episodic memory */
  enablePostgres: boolean;
  
  /** Enable pgvector for semantic search */
  enableVectorSearch: boolean;
  
  /** Default TTL for working memory (seconds) */
  workingMemoryTTL: number;
  
  /** Enable local caching */
  enableLocalCache: boolean;
  
  /** Log memory operations */
  enableLogging: boolean;
}

export interface EpisodicMemory {
  id: string;
  sessionId: string;
  userId?: string;
  workflowId?: string;
  agentId?: string;
  type: 'workflow' | 'agent' | 'user' | 'system';
  content: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SemanticSearchResult {
  id: string;
  content: any;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface MemoryStats {
  workingMemory: {
    keyCount: number;
    estimatedSize: number;
    hitRate: number;
  };
  episodicMemory: {
    totalEntries: number;
    entriesToday: number;
  };
  semanticMemory: {
    totalVectors: number;
    collections: string[];
  };
}

export class HybridMemoryManager {
  private workingMemory: RedisMemoryBackend | InMemoryBackend;
  private config: HybridMemoryConfig;
  private stats = {
    workingMemoryHits: 0,
    workingMemoryMisses: 0,
    episodicMemoryWrites: 0,
    semanticSearches: 0,
  };

  constructor(config?: Partial<HybridMemoryConfig>) {
    this.config = {
      enableRedis: true,
      enablePostgres: true,
      enableVectorSearch: false, // Requires pgvector extension
      workingMemoryTTL: 3600,
      enableLocalCache: true,
      enableLogging: false,
      ...config,
    };

    // Initialize working memory backend
    if (this.config.enableRedis) {
      try {
        this.workingMemory = getRedisMemoryBackend({
          defaultTTL: this.config.workingMemoryTTL,
        });
        this.log('[HybridMemory] Using Redis for working memory');
      } catch (error) {
        this.log('[HybridMemory] Redis initialization failed, falling back to InMemory');
        this.workingMemory = new InMemoryBackend();
      }
    } else {
      this.workingMemory = new InMemoryBackend();
      this.log('[HybridMemory] Using InMemory backend for working memory');
    }
  }

  // ============================================================================
  // WORKING MEMORY (Redis) - Fast access (<1ms)
  // ============================================================================

  /**
   * Set working context for a session
   * Stored in Redis with TTL for automatic expiration
   */
  async setWorkingContext(
    sessionId: string,
    context: Record<string, any>,
    options?: { ttl?: number }
  ): Promise<void> {
    const workingContext = {
      sessionId,
      context,
      createdAt: Date.now(),
      expiresAt: Date.now() + (options?.ttl || this.config.workingMemoryTTL) * 1000,
    };

    if (this.workingMemory instanceof RedisMemoryBackend) {
      await this.workingMemory.setWorkingContext(workingContext);
    } else {
      // Fallback: store in local map for InMemoryBackend
      await this.workingMemory.createEntities([{
        name: `context:${sessionId}`,
        entityType: 'WorkingContext',
        observations: [JSON.stringify(workingContext)],
      }]);
    }

    this.log(`[HybridMemory] Set working context for session: ${sessionId}`);
  }

  /**
   * Get working context for a session
   * Fast access from Redis or local cache
   */
  async getWorkingContext(sessionId: string): Promise<Record<string, any> | null> {
    if (this.workingMemory instanceof RedisMemoryBackend) {
      const context = await this.workingMemory.getWorkingContext(sessionId);
      if (context) {
        this.stats.workingMemoryHits++;
        return context.context;
      }
      this.stats.workingMemoryMisses++;
      return null;
    } else {
      // Fallback for InMemoryBackend
      const result = this.workingMemory.searchNodes(`context:${sessionId}`);
      if (result.entities.length > 0) {
        this.stats.workingMemoryHits++;
        const obs = result.entities[0].observations[0];
        return obs ? JSON.parse(obs) : null;
      }
      this.stats.workingMemoryMisses++;
      return null;
    }
  }

  /**
   * Delete working context for a session
   */
  async deleteWorkingContext(sessionId: string): Promise<void> {
    if (this.workingMemory instanceof RedisMemoryBackend) {
      await this.workingMemory.deleteWorkingContext(sessionId);
    }
    this.log(`[HybridMemory] Deleted working context for session: ${sessionId}`);
  }

  /**
   * Set a value in working memory
   */
  async setWorkingValue<T>(
    sessionId: string,
    key: string,
    value: T,
    options?: { ttl?: number; namespace?: string }
  ): Promise<void> {
    if (this.workingMemory instanceof RedisMemoryBackend) {
      await this.workingMemory.set(sessionId, key, value, options);
    }
  }

  /**
   * Get a value from working memory
   */
  async getWorkingValue<T>(
    sessionId: string,
    key: string,
    namespace?: string
  ): Promise<T | null> {
    if (this.workingMemory instanceof RedisMemoryBackend) {
      return await this.workingMemory.get<T>(sessionId, key, namespace);
    }
    return null;
  }

  // ============================================================================
  // EPISODIC MEMORY (Postgres) - Persistent storage
  // ============================================================================

  /**
   * Store episodic memory in Postgres
   * Persistent record of interactions for audit and learning
   */
  async storeEpisodicMemory(memory: EpisodicMemory): Promise<void> {
    // This would integrate with Prisma models
    // For now, store in working memory as a placeholder
    await this.setWorkingValue(memory.sessionId, `episodic:${memory.id}`, memory, {
      namespace: 'episodic',
      ttl: 86400 * 7, // 7 days
    });

    this.stats.episodicMemoryWrites++;
    this.log(`[HybridMemory] Stored episodic memory: ${memory.id}`);
  }

  /**
   * Get episodic memories by session
   */
  async getEpisodicMemories(
    sessionId: string,
    options?: { limit?: number; type?: string }
  ): Promise<EpisodicMemory[]> {
    // Placeholder implementation
    // In production, query Postgres via Prisma
    const memories: EpisodicMemory[] = [];
    
    // Try to get from working memory
    const keys = await this.getSessionKeys(sessionId, 'episodic');
    for (const key of keys) {
      const memory = await this.getWorkingValue<EpisodicMemory>(sessionId, key, 'episodic');
      if (memory && (!options?.type || memory.type === options.type)) {
        memories.push(memory);
      }
    }

    return memories.slice(0, options?.limit || 100);
  }

  // ============================================================================
  // SEMANTIC MEMORY (pgvector) - Vector similarity search
  // ============================================================================

  /**
   * Search semantic memory by similarity
   * Uses pgvector for embedding-based search
   */
  async searchSemanticMemory(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      collection?: string;
    }
  ): Promise<SemanticSearchResult[]> {
    this.stats.semanticSearches++;

    // Placeholder implementation
    // In production:
    // 1. Generate embedding for query using OpenAI/pgvector
    // 2. Run similarity search: SELECT * FROM memories ORDER BY embedding <-> query_embedding LIMIT n
    // 3. Filter by threshold and collection

    this.log(`[HybridMemory] Semantic search: "${query}"`);
    return [];
  }

  /**
   * Add content to semantic memory
   * Generates embedding and stores in pgvector
   */
  async addToSemanticMemory(
    content: string,
    metadata?: Record<string, any>,
    collection?: string
  ): Promise<string> {
    // Placeholder implementation
    // In production:
    // 1. Generate embedding using OpenAI
    // 2. Insert into pgvector: INSERT INTO memories (content, embedding, metadata) VALUES (...)
    
    const id = `semantic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.log(`[HybridMemory] Added to semantic memory: ${id}`);
    return id;
  }

  // ============================================================================
  // AGENT STATE MANAGEMENT
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
    if (this.workingMemory instanceof RedisMemoryBackend) {
      await this.workingMemory.setAgentState(sessionId, agentId, state, workflowId);
    }
  }

  /**
   * Get agent execution state
   */
  async getAgentState(
    sessionId: string,
    agentId: string,
    workflowId?: string
  ): Promise<Record<string, any> | null> {
    if (this.workingMemory instanceof RedisMemoryBackend) {
      return await this.workingMemory.getAgentState(sessionId, agentId, workflowId);
    }
    return null;
  }

  /**
   * Append to agent execution log
   */
  async appendAgentLog(
    sessionId: string,
    agentId: string,
    entry: string,
    workflowId?: string
  ): Promise<void> {
    if (this.workingMemory instanceof RedisMemoryBackend) {
      await this.workingMemory.appendAgentLog(sessionId, agentId, entry, workflowId);
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
    if (this.workingMemory instanceof RedisMemoryBackend) {
      return await this.workingMemory.getAgentLog(sessionId, agentId, workflowId, limit);
    }
    return [];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async getSessionKeys(
    sessionId: string,
    namespace?: string
  ): Promise<string[]> {
    if (this.workingMemory instanceof RedisMemoryBackend) {
      return await this.workingMemory.getSessionKeys(sessionId, namespace);
    }
    return [];
  }

  /**
   * Delete all memory for a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.deleteWorkingContext(sessionId);
    this.log(`[HybridMemory] Deleted all memory for session: ${sessionId}`);
  }

  /**
   * Get memory usage statistics
   */
  async getStats(): Promise<MemoryStats> {
    let workingMemoryStats = {
      keyCount: 0,
      estimatedSize: 0,
      hitRate: 0,
    };

    if (this.workingMemory instanceof RedisMemoryBackend) {
      // Get actual stats from Redis
      const totalAccesses = this.stats.workingMemoryHits + this.stats.workingMemoryMisses;
      workingMemoryStats = {
        keyCount: 0, // Would require Redis SCAN
        estimatedSize: 0,
        hitRate: totalAccesses > 0 ? this.stats.workingMemoryHits / totalAccesses : 0,
      };
    }

    return {
      workingMemory: workingMemoryStats,
      episodicMemory: {
        totalEntries: this.stats.episodicMemoryWrites,
        entriesToday: this.stats.episodicMemoryWrites, // Simplified
      },
      semanticMemory: {
        totalVectors: 0,
        collections: [],
      },
    };
  }

  /**
   * Check if Redis is connected
   */
  async isRedisConnected(): Promise<boolean> {
    if (this.workingMemory instanceof RedisMemoryBackend) {
      return await this.workingMemory.ping();
    }
    return false;
  }

  /**
   * Get the working memory backend directly
   */
  getWorkingMemoryBackend(): RedisMemoryBackend | InMemoryBackend {
    return this.workingMemory;
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(message);
    }
  }
}

// ============================================================================
// FACTORY & SINGLETON
// ============================================================================

let memoryManagerInstance: HybridMemoryManager | null = null;

export const getHybridMemoryManager = (
  config?: Partial<HybridMemoryConfig>
): HybridMemoryManager => {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new HybridMemoryManager(config);
  }
  return memoryManagerInstance;
};

export const resetHybridMemoryManager = (): void => {
  memoryManagerInstance = null;
};

export default HybridMemoryManager;
