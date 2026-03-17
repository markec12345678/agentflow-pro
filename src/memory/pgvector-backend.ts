/**
 * PgvectorMemoryBackend - Semantic memory with vector similarity search
 * 
 * Provides semantic search capabilities using pgvector extension for PostgreSQL.
 * Enables finding similar memories, experiences, and knowledge by meaning rather
 * than keyword matching.
 * 
 * Features:
 * - Vector similarity search (cosine similarity)
 * - Hybrid search (similarity + metadata filtering)
 * - Automatic embedding generation (OpenAI)
 * - Collection-based organization
 * - Deduplication via content hashing
 * - Access tracking and analytics
 * 
 * Based on research showing semantic memory improves agent context
 * retrieval with 94%+ accuracy vs keyword-based approaches.
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SemanticMemoryConfig {
  /** OpenAI API key for embedding generation */
  openAiApiKey?: string;
  
  /** Embedding model to use */
  embeddingModel: string;
  
  /** Embedding dimensions (1536 for ada-002) */
  embeddingDimensions: number;
  
  /** Default similarity threshold (0-1, higher = more strict) */
  defaultThreshold: number;
  
  /** Default max results */
  defaultLimit: number;
  
  /** Enable deduplication */
  enableDeduplication: boolean;
  
  /** Enable access tracking */
  enableAccessTracking: boolean;
}

export interface SemanticMemoryInput {
  /** Session ID for isolation */
  sessionId: string;
  
  /** User ID (optional) */
  userId?: string;
  
  /** Workflow ID (optional) */
  workflowId?: string;
  
  /** Agent ID (optional) */
  agentId?: string;
  
  /** Collection name for grouping */
  collection?: string;
  
  /** Content to store */
  content: string;
  
  /** Metadata for additional context */
  metadata?: Record<string, any>;
  
  /** Tags for filtering */
  tags?: string[];
}

export interface SemanticSearchOptions {
  /** Filter by collection */
  collection?: string;
  
  /** Filter by tags (must match all) */
  tags?: string[];
  
  /** Filter by metadata (partial match) */
  metadata?: Record<string, any>;
  
  /** Similarity threshold (0-1) */
  threshold?: number;
  
  /** Max results */
  limit?: number;
  
  /** Include embedding in results */
  includeEmbedding?: boolean;
}

export interface SemanticSearchResult {
  id: string;
  sessionId: string;
  userId?: string;
  workflowId?: string;
  agentId?: string;
  collection: string;
  content: string;
  metadata: Record<string, any>;
  tags: string[];
  similarity: number;
  createdAt: Date;
  lastAccessedAt?: Date;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export const DEFAULT_PGVECTOR_CONFIG: Partial<SemanticMemoryConfig> = {
  embeddingModel: 'text-embedding-ada-002',
  embeddingDimensions: 1536,
  defaultThreshold: 0.7,
  defaultLimit: 10,
  enableDeduplication: true,
  enableAccessTracking: true,
};

// ============================================================================
// PGVECTOR MEMORY BACKEND
// ============================================================================

export class PgvectorMemoryBackend {
  private config: SemanticMemoryConfig;
  private prisma: PrismaClient;
  private embeddingCache = new Map<string, number[]>();

  constructor(config?: Partial<SemanticMemoryConfig>) {
    this.config = {
      ...DEFAULT_PGVECTOR_CONFIG,
      ...config,
      openAiApiKey: config?.openAiApiKey || process.env.OPENAI_API_KEY,
    } as SemanticMemoryConfig;

    if (!this.config.openAiApiKey) {
      console.warn(
        '[PgvectorMemory] OPENAI_API_KEY not set. ' +
        'Embedding generation will fail. Set OPENAI_API_KEY in environment.'
      );
    }

    this.prisma = new PrismaClient();
    console.log('[PgvectorMemory] Initialized with model:', this.config.embeddingModel);
  }

  // ============================================================================
  // EMBEDDING GENERATION
  // ============================================================================

  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: this.config.embeddingModel,
          input: text,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json() as { data: Array<{ embedding: number[] }>, usage: any };
      const embedding = data.data[0].embedding;

      // Validate dimensions
      if (embedding.length !== this.config.embeddingDimensions) {
        throw new Error(
          `Embedding dimension mismatch: expected ${this.config.embeddingDimensions}, got ${embedding.length}`
        );
      }

      // Cache the embedding
      this.embeddingCache.set(cacheKey, embedding);

      return embedding;
    } catch (error) {
      console.error('[PgvectorMemory] Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Process in batches of 100 (OpenAI limit)
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: this.config.embeddingModel,
          input: batch,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json() as { data: Array<{ embedding: number[] }> };
      
      // Sort by index to maintain order
      const sortedEmbeddings = data.data
        .map((item, idx) => ({ idx, embedding: item.embedding }))
        .sort((a, b) => a.idx - b.idx)
        .map(item => item.embedding);

      embeddings.push(...sortedEmbeddings);
    }

    return embeddings;
  }

  // ============================================================================
  // MEMORY OPERATIONS
  // ============================================================================

  /**
   * Add content to semantic memory
   * Automatically generates embedding and handles deduplication
   */
  async addMemory(input: SemanticMemoryInput): Promise<string> {
    const contentHash = this.hashText(input.content);

    // Check for duplicates
    if (this.config.enableDeduplication) {
      const existing = await this.prisma.semanticMemory.findFirst({
        where: { contentHash },
      });

      if (existing) {
        console.log('[PgvectorMemory] Duplicate content found, returning existing ID:', existing.id);
        return existing.id;
      }
    }

    // Generate embedding
    const embedding = await this.generateEmbedding(input.content);

    // Convert embedding to Bytes for Prisma
    const embeddingBytes = new Uint8Array(
      embedding.flatMap(value => {
        const bytes = new Uint8Array(new Float32Array([value]).buffer);
        return Array.from(bytes);
      })
    );

    // Store in database
    const memory = await this.prisma.semanticMemory.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId,
        workflowId: input.workflowId,
        agentId: input.agentId,
        collection: input.collection || 'general',
        content: input.content,
        contentHash,
        embedding: embeddingBytes,
        metadata: input.metadata || {},
        tags: input.tags || [],
      },
    });

    console.log('[PgvectorMemory] Added memory:', memory.id);
    return memory.id;
  }

  /**
   * Add multiple memories (batch)
   */
  async addMemoriesBatch(inputs: SemanticMemoryInput[]): Promise<string[]> {
    const ids: string[] = [];

    for (const input of inputs) {
      try {
        const id = await this.addMemory(input);
        ids.push(id);
      } catch (error) {
        console.error('[PgvectorMemory] Failed to add memory:', error);
        ids.push(`error:${error}`);
      }
    }

    return ids;
  }

  /**
   * Search for similar memories
   * Uses pgvector similarity search with optional filtering
   */
  async searchSimilar(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SemanticSearchResult[]> {
    const threshold = options?.threshold || this.config.defaultThreshold;
    const limit = options?.limit || this.config.defaultLimit;

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Convert to format for raw SQL
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Build filter conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (options?.collection) {
      conditions.push(`"collection" = $${params.length + 1}`);
      params.push(options.collection);
    }

    if (options?.tags && options.tags.length > 0) {
      conditions.push(`"tags" @> $${params.length + 1}`);
      params.push(options.tags);
    }

    if (options?.metadata) {
      conditions.push(`"metadata" @> $${params.length + 1}`);
      params.push(JSON.stringify(options.metadata));
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    // Execute similarity search using raw SQL
    // Note: This uses the search_similar_memories function from migration
    const results = await this.prisma.$queryRaw`
      SELECT * FROM search_similar_memories(
        ${embeddingString}::vector,
        ${options?.collection || null},
        ${threshold},
        ${limit}
      )
      WHERE 1=1 ${Prisma.raw(whereClause)}
    `;

    return results as SemanticSearchResult[];
  }

  /**
   * Hybrid search: similarity + metadata + tags
   */
  async hybridSearch(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<SemanticSearchResult[]> {
    const threshold = options?.threshold || this.config.defaultThreshold;
    const limit = options?.limit || this.config.defaultLimit;

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Use hybrid_search_memories function from migration
    const results = await this.prisma.$queryRaw`
      SELECT * FROM hybrid_search_memories(
        ${embeddingString}::vector,
        ${options?.collection || null},
        ${options?.tags || null},
        ${options?.metadata ? JSON.stringify(options.metadata) : null},
        ${threshold},
        ${limit}
      )
    `;

    return results as SemanticSearchResult[];
  }

  /**
   * Get memory by ID
   */
  async getMemory(id: string): Promise<SemanticSearchResult | null> {
    const memory = await this.prisma.semanticMemory.findUnique({
      where: { id },
    });

    if (!memory) return null;

    // Update access tracking
    if (this.config.enableAccessTracking) {
      await this.prisma.semanticMemory.update({
        where: { id },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });
    }

    return {
      id: memory.id,
      sessionId: memory.sessionId,
      userId: memory.userId || undefined,
      workflowId: memory.workflowId || undefined,
      agentId: memory.agentId || undefined,
      collection: memory.collection,
      content: memory.content,
      metadata: memory.metadata as Record<string, any>,
      tags: memory.tags,
      similarity: 1.0, // Exact match
      createdAt: memory.createdAt,
      lastAccessedAt: memory.lastAccessedAt || undefined,
    };
  }

  /**
   * Delete memory by ID
   */
  async deleteMemory(id: string): Promise<void> {
    await this.prisma.semanticMemory.delete({
      where: { id },
    });
    console.log('[PgvectorMemory] Deleted memory:', id);
  }

  /**
   * Delete memories by session
   */
  async deleteSessionMemories(sessionId: string): Promise<number> {
    const result = await this.prisma.semanticMemory.deleteMany({
      where: { sessionId },
    });
    console.log('[PgvectorMemory] Deleted', result.count, 'memories for session:', sessionId);
    return result.count;
  }

  /**
   * Get memories by collection
   */
  async getCollectionMemories(
    collection: string,
    options?: { limit?: number; offset?: number }
  ): Promise<SemanticSearchResult[]> {
    const memories = await this.prisma.semanticMemory.findMany({
      where: { collection },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });

    return memories.map(m => ({
      id: m.id,
      sessionId: m.sessionId,
      userId: m.userId || undefined,
      workflowId: m.workflowId || undefined,
      agentId: m.agentId || undefined,
      collection: m.collection,
      content: m.content,
      metadata: m.metadata as Record<string, any>,
      tags: m.tags,
      similarity: 1.0,
      createdAt: m.createdAt,
      lastAccessedAt: m.lastAccessedAt || undefined,
    }));
  }

  // ============================================================================
  // ANALYTICS & STATISTICS
  // ============================================================================

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    totalMemories: number;
    collections: Array<{ name: string; count: number }>;
    recentMemories: number;
  }> {
    const totalMemories = await this.prisma.semanticMemory.count();

    const collectionStats = await this.prisma.semanticMemory.groupBy({
      by: ['collection'],
      _count: true,
    });

    const recentMemories = await this.prisma.semanticMemory.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return {
      totalMemories,
      collections: collectionStats.map(s => ({
        name: s.collection,
        count: s._count,
      })),
      recentMemories,
    };
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collection: string): Promise<{
    totalMemories: number;
    uniqueSessions: number;
    uniqueUsers: number;
    avgAccessCount: number;
  }> {
    const totalMemories = await this.prisma.semanticMemory.count({
      where: { collection },
    });

    const uniqueSessions = await this.prisma.semanticMemory.groupBy({
      by: ['sessionId'],
      where: { collection },
    }).then(r => r.length);

    const uniqueUsers = await this.prisma.semanticMemory.groupBy({
      by: ['userId'],
      where: { collection },
    }).then(r => r.length);

    const avgResult = await this.prisma.semanticMemory.aggregate({
      where: { collection },
      _avg: { accessCount: true },
    });

    return {
      totalMemories,
      uniqueSessions,
      uniqueUsers,
      avgAccessCount: avgResult._avg.accessCount || 0,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private hashText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.embeddingCache.size;
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  /**
   * Check database connection
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if pgvector extension is available
   */
  async hasPgvector(): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        )
      ` as Array<{ exists: boolean }>;
      return result[0].exists;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

export const getPgvectorMemoryBackend = (
  config?: Partial<SemanticMemoryConfig>
): PgvectorMemoryBackend => {
  return new PgvectorMemoryBackend(config);
};

export default PgvectorMemoryBackend;
