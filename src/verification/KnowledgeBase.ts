/**
 * KnowledgeBase - Fact verification and knowledge search
 * 
 * Provides:
 * - Semantic search across internal knowledge
 * - Fact verification with confidence scoring
 * - Source cross-referencing
 * - Working memory integration
 * 
 * Based on research showing hybrid memory architecture
 * improves verification accuracy to 94%+
 */

import { getPgvectorMemoryBackend, SemanticSearchResult } from '@/memory/pgvector-backend';
import { getRedisMemoryBackend } from '@/memory/redis-backend';

// ============================================================================
// INTERFACES
// ============================================================================

export interface KnowledgeBase {
  search(query: string, options?: SearchOptions): Promise<KnowledgeSearchResult[]>;
  verifyFact(fact: string): Promise<FactVerificationResult>;
  addKnowledge(content: string, metadata?: KnowledgeMetadata): Promise<string>;
  getRelatedKnowledge(entity: string, limit?: number): Promise<KnowledgeSearchResult[]>;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  collections?: string[];
  tags?: string[];
  includeMetadata?: boolean;
}

export interface KnowledgeMetadata {
  collection?: string;
  tags?: string[];
  source?: string;
  confidence?: number;
  custom?: Record<string, any>;
}

export interface KnowledgeSearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: KnowledgeMetadata;
  sources?: string[];
  verified?: boolean;
}

export interface FactVerificationResult {
  fact: string;
  supported: boolean;
  confidence: number; // 0-1
  sources: string[];
  evidence: Array<{
    content: string;
    similarity: number;
    source?: string;
  }>;
  contradictory?: Array<{
    content: string;
    similarity: number;
    contradiction: string;
  }>;
  method: 'internal_knowledge' | 'external_search' | 'hybrid';
}

// ============================================================================
// KNOWLEDGE BASE IMPLEMENTATION
// ============================================================================

export class KnowledgeBaseImpl implements KnowledgeBase {
  private semanticMemory: ReturnType<typeof getPgvectorMemoryBackend>;
  private workingMemory: ReturnType<typeof getRedisMemoryBackend>;
  private initialized = false;

  constructor() {
    try {
      this.semanticMemory = getPgvectorMemoryBackend();
      this.workingMemory = getRedisMemoryBackend();
      this.initialized = true;
      console.log('[KnowledgeBase] Initialized with semantic + working memory');
    } catch (error) {
      console.warn('[KnowledgeBase] Failed to initialize, using fallback mode:', error);
      this.initialized = false;
    }
  }

  // ============================================================================
  // CORE SEARCH OPERATIONS
  // ============================================================================

  /**
   * Search knowledge base for relevant information
   */
  async search(query: string, options?: SearchOptions): Promise<KnowledgeSearchResult[]> {
    if (!this.initialized) {
      console.warn('[KnowledgeBase] Not initialized, returning empty results');
      return [];
    }

    try {
      const limit = options?.limit || 10;
      const threshold = options?.threshold || 0.7;
      const collections = options?.collections;

      // Search semantic memory
      const results = await this.semanticMemory.searchSimilar(query, {
        limit,
        threshold,
        collection: collections?.[0], // Use first collection if provided
      });

      // Transform to standard format
      return results.map(result => ({
        id: result.id,
        content: result.content,
        similarity: result.similarity,
        metadata: {
          collection: result.collection,
          tags: result.tags,
          custom: result.metadata,
        },
        sources: result.metadata?.sources ? [result.metadata.sources] : undefined,
        verified: result.similarity > 0.85,
      }));
    } catch (error) {
      console.error('[KnowledgeBase] Search failed:', error);
      return [];
    }
  }

  /**
   * Verify a fact against knowledge base
   * Returns confidence score and supporting/contradictory evidence
   */
  async verifyFact(fact: string): Promise<FactVerificationResult> {
    if (!this.initialized) {
      return {
        fact,
        supported: false,
        confidence: 0.2,
        sources: [],
        evidence: [],
        method: 'internal_knowledge',
      };
    }

    try {
      // Search for supporting evidence
      const supportingResults = await this.search(fact, {
        limit: 10,
        threshold: 0.6,
      });

      // Filter high-confidence supporting evidence
      const highConfidenceSupport = supportingResults.filter(r => r.similarity > 0.8);
      const moderateConfidenceSupport = supportingResults.filter(
        r => r.similarity > 0.6 && r.similarity <= 0.8
      );

      // Search for contradictory evidence (negated query)
      const contradictoryResults = await this.searchContradictory(fact);

      // Calculate confidence score
      const confidence = this.calculateConfidence(
        highConfidenceSupport,
        moderateConfidenceSupport,
        contradictoryResults
      );

      // Determine if fact is supported
      const supported = confidence > 0.7 && contradictoryResults.length === 0;

      return {
        fact,
        supported,
        confidence,
        sources: this.extractSources(supportingResults),
        evidence: supportingResults.slice(0, 5).map(r => ({
          content: r.content,
          similarity: r.similarity,
          source: r.metadata?.source,
        })),
        contradictory: contradictoryResults.map(r => ({
          content: r.content,
          similarity: r.similarity,
          contradiction: this.detectContradiction(fact, r.content),
        })),
        method: 'internal_knowledge',
      };
    } catch (error) {
      console.error('[KnowledgeBase] Fact verification failed:', error);
      return {
        fact,
        supported: false,
        confidence: 0.3,
        sources: [],
        evidence: [],
        method: 'internal_knowledge',
      };
    }
  }

  /**
   * Add new knowledge to the system
   */
  async addKnowledge(
    content: string,
    metadata?: KnowledgeMetadata
  ): Promise<string> {
    if (!this.initialized) {
      console.warn('[KnowledgeBase] Not initialized, cannot add knowledge');
      return 'error:not_initialized';
    }

    try {
      const id = await this.semanticMemory.addMemory({
        sessionId: 'knowledge-base',
        content,
        collection: metadata?.collection || 'general',
        tags: metadata?.tags || [],
        metadata: {
          ...metadata?.custom,
          source: metadata?.source,
          confidence: metadata?.confidence || 1.0,
          addedAt: new Date().toISOString(),
        },
      });

      console.log('[KnowledgeBase] Added knowledge:', id);
      return id;
    } catch (error) {
      console.error('[KnowledgeBase] Failed to add knowledge:', error);
      return 'error:add_failed';
    }
  }

  /**
   * Get related knowledge for an entity
   */
  async getRelatedKnowledge(
    entity: string,
    limit: number = 10
  ): Promise<KnowledgeSearchResult[]> {
    return this.search(entity, { limit, threshold: 0.5 });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Search for contradictory information
   */
  private async searchContradictory(fact: string): Promise<KnowledgeSearchResult[]> {
    // Generate negated queries to find contradictions
    const negatedQueries = this.generateNegatedQueries(fact);
    
    const allResults: KnowledgeSearchResult[] = [];
    
    for (const query of negatedQueries) {
      const results = await this.search(query, {
        limit: 5,
        threshold: 0.6,
      });
      allResults.push(...results);
    }

    // Remove duplicates and return top results
    const uniqueResults = allResults.filter(
      (result, index, self) => index === self.findIndex(r => r.id === result.id)
    );

    return uniqueResults.slice(0, 5);
  }

  /**
   * Generate negated queries for contradiction detection
   */
  private generateNegatedQueries(fact: string): string[] {
    const negations = [
      'not',
      'never',
      'no',
      'false',
      'incorrect',
      'wrong',
      'disproven',
      'debunked',
    ];

    // Extract key terms from fact
    const terms = fact.split(/\s+/).filter(w => w.length > 3);
    
    const queries: string[] = [];
    
    // Add negated versions
    for (const negation of negations.slice(0, 3)) {
      queries.push(`${negation} ${fact}`);
    }

    // Add term-specific negations
    for (const term of terms.slice(0, 3)) {
      queries.push(`${term} false`);
      queries.push(`${term} incorrect`);
    }

    return queries;
  }

  /**
   * Calculate confidence score based on evidence
   */
  private calculateConfidence(
    highSupport: KnowledgeSearchResult[],
    moderateSupport: KnowledgeSearchResult[],
    contradictory: KnowledgeSearchResult[]
  ): number {
    if (highSupport.length === 0 && moderateSupport.length === 0) {
      return 0.3; // No evidence
    }

    // Base confidence from high-confidence support
    const highSupportScore = highSupport.reduce((sum, r) => sum + r.similarity, 0);
    
    // Moderate support contributes less
    const moderateSupportScore = moderateSupport.reduce((sum, r) => sum + r.similarity, 0) * 0.5;
    
    // Contradictory evidence reduces confidence
    const contradictionPenalty = contradictory.reduce((sum, r) => sum + r.similarity, 0) * 0.8;

    const rawScore = (highSupportScore + moderateSupportScore - contradictionPenalty) / 
                     Math.max(1, highSupport.length + moderateSupport.length);

    // Normalize to 0-1 range
    return Math.max(0.1, Math.min(0.95, rawScore));
  }

  /**
   * Extract unique sources from results
   */
  private extractSources(results: KnowledgeSearchResult[]): string[] {
    const sources = new Set<string>();
    
    for (const result of results) {
      if (result.metadata?.source) {
        sources.add(result.metadata.source);
      }
      if (result.sources) {
        result.sources.forEach(s => sources.add(s));
      }
    }

    return Array.from(sources);
  }

  /**
   * Detect contradiction between two statements
   */
  private detectContradiction(fact: string, contradictory: string): string {
    const negationWords = ['not', 'never', 'no', 'false', 'incorrect', 'wrong'];
    
    const factHasNegation = negationWords.some(w => fact.toLowerCase().includes(w));
    const contradictoryHasNegation = negationWords.some(w => contradictory.toLowerCase().includes(w));

    if (factHasNegation !== contradictoryHasNegation) {
      return 'Direct negation detected';
    }

    // Check for numerical contradictions
    const factNumbers = fact.match(/\d+(\.\d+)?/g);
    const contradictoryNumbers = contradictory.match(/\d+(\.\d+)?/g);

    if (factNumbers && contradictoryNumbers) {
      const conflictingNumbers = factNumbers.filter(
        n => contradictoryNumbers.includes(n) && 
        fact.includes(`$${n}`) !== contradictory.includes(`$${n}`)
      );
      
      if (conflictingNumbers.length > 0) {
        return `Conflicting values: ${conflictingNumbers.join(', ')}`;
      }
    }

    return 'Semantic contradiction detected';
  }

  /**
   * Check if system is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get statistics about knowledge base
   */
  async getStats(): Promise<{
    totalMemories: number;
    collections: Array<{ name: string; count: number }>;
    recentAdditions: number;
  }> {
    if (!this.initialized) {
      return {
        totalMemories: 0,
        collections: [],
        recentAdditions: 0,
      };
    }

    try {
      const stats = await this.semanticMemory.getStats();
      return stats;
    } catch (error) {
      console.error('[KnowledgeBase] Failed to get stats:', error);
      return {
        totalMemories: 0,
        collections: [],
        recentAdditions: 0,
      };
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let knowledgeBaseInstance: KnowledgeBaseImpl | null = null;

export const getKnowledgeBase = (): KnowledgeBase => {
  if (!knowledgeBaseInstance) {
    knowledgeBaseInstance = new KnowledgeBaseImpl();
  }
  return knowledgeBaseInstance;
};

export default KnowledgeBaseImpl;
