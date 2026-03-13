/**
 * Core Ports - AI Provider Interfaces
 * 
 * Ti interface-i definirajo pogodbe za AI storitve.
 * Implementacije so v infrastructure/ai/
 */

// ============================================================================
// Language Model Types
// ============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
}

export interface LLMResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}

// ============================================================================
// AI Provider Interface
// ============================================================================

export interface AIProvider {
  /**
   * Generate text response from prompt
   */
  generateText(prompt: string, options?: LLMOptions): Promise<LLMResponse>
  
  /**
   * Generate text response from conversation messages
   */
  generateChat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>
  
  /**
   * Generate image from text description
   */
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<Buffer>
  
  /**
   * Generate embeddings for text
   */
  embed(text: string): Promise<number[]>
  
  /**
   * Get model ID
   */
  getModelId(): string
}

// ============================================================================
// Image Generation Options
// ============================================================================

export interface ImageGenerationOptions {
  width?: number
  height?: number
  style?: 'natural' | 'vivid'
  quality?: 'standard' | 'hd'
}

// ============================================================================
// Embedding Model Interface
// ============================================================================

export interface EmbeddingModel {
  /**
   * Generate embedding vector for text
   */
  embed(text: string): Promise<number[]>
  
  /**
   * Generate embeddings for multiple texts
   */
  embedBatch(texts: string[]): Promise<number[][]>
  
  /**
   * Get embedding dimensions
   */
  getDimensions(): number
  
  /**
   * Get model name
   */
  getModelName(): string
}

// ============================================================================
// Semantic Cache Interface
// ============================================================================

export interface SemanticCache {
  /**
   * Get cached response for similar query
   */
  get(query: string, threshold?: number): Promise<string | null>
  
  /**
   * Cache response for query
   */
  set(query: string, response: string): Promise<void>
  
  /**
   * Clear cache
   */
  clear(): Promise<void>
}
