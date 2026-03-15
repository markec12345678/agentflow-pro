/**
 * AgentFlow Pro - RAG Knowledge Base
 * Tourism knowledge ingestion, embeddings, and retrieval
 */

import { prisma } from "@/database/schema";
import { QdrantClient } from "@qdrant/qdrant-js";
import { v4 as uuidv4 } from "uuid";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = "tourism-knowledge";

const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

export interface KnowledgeChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    url?: string;
    region?: string;
    category: string;
    language: string;
    title?: string;
  };
  embedding?: number[];
}

export type KnowledgeCategory = 
  | "laws"           // Tourism laws & regulations
  | "attractions"    // Local attractions
  | "restaurants"    // Dining recommendations
  | "transport"      // Transportation options
  | "emergency"      // Emergency services
  | "weather"        // Weather patterns
  | "events"         // Local events
  | "accommodation"  // Accommodation info
  | "activities"     // Activities & experiences
  | "culture"        // Cultural information
  | "history"        // Historical information
  | "gastronomy"     // Food & wine
  | "outdoor"        // Outdoor activities
  | "wellness"       // Wellness & spa
  | "business"       // Business travel
  | "family"         // Family travel
  | "accessibility"; // Accessibility info

/**
 * Ingest knowledge from URL
 */
export async function ingestFromUrl(data: {
  url: string;
  category: KnowledgeCategory;
  region?: string;
  language?: string;
}): Promise<{ chunks: number; errors: string[] }> {
  const errors: string[] = [];
  let chunkCount = 0;

  try {
    // Fetch content (in production, use Firecrawl or similar)
    const response = await fetch(data.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract text from HTML (simplified - in production use proper parser)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Chunk text
    const chunks = chunkText(text, 500, 50); // 500 chars with 50 char overlap

    // Process each chunk
    for (const chunk of chunks) {
      try {
        // Generate embedding (in production, use OpenAI embeddings)
        const embedding = await generateEmbedding(chunk);

        // Store in Qdrant
        await qdrantClient.upsert(COLLECTION_NAME, {
          points: [
            {
              id: uuidv4(),
              vector: embedding,
              payload: {
                content: chunk,
                source: data.url,
                category: data.category,
                region: data.region,
                language: data.language || "sl",
                ingestedAt: new Date().toISOString(),
              },
            },
          ],
        });

        // Store metadata in PostgreSQL
        await prisma.knowledgeBase.create({
          data: {
            content: chunk,
            source: data.url,
            category: data.category,
            region: data.region,
            language: data.language || "sl",
            metadata: {
              ingestedAt: new Date().toISOString(),
            },
          },
        });

        chunkCount++;
      } catch (error) {
        errors.push(`Failed to process chunk: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to ingest URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { chunks: chunkCount, errors };
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(
  query: string,
  options?: {
    category?: KnowledgeCategory;
    region?: string;
    language?: string;
    limit?: number;
  }
): Promise<Array<{ content: string; score: number; metadata: any }>> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Search in Qdrant
    const searchResults = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: options?.limit || 10,
      filter: {
        must: [
          ...(options?.category ? [{ key: "category", match: { value: options.category } }] : []),
          ...(options?.region ? [{ key: "region", match: { value: options.region } }] : []),
          ...(options?.language ? [{ key: "language", match: { value: options.language } }] : []),
        ],
      },
    });

    return searchResults.map(result => ({
      content: result.payload?.content as string,
      score: result.score,
      metadata: result.payload,
    }));
  } catch (error) {
    logger.error("[RAG Search] Error:", error);
    return [];
  }
}

/**
 * Generate answer with RAG
 */
export async function generateAnswerWithRAG(
  query: string,
  options?: {
    category?: KnowledgeCategory;
    region?: string;
    language?: string;
  }
): Promise<{ answer: string; sources: Array<{ content: string; score: number }> }> {
  // Search for relevant chunks
  const results = await searchKnowledge(query, options);

  if (results.length === 0) {
    return {
      answer: "Oprostite, nimam informacij o tej temi.",
      sources: [],
    };
  }

  // Format context
  const context = results
    .map(r => r.content)
    .join("\n\n");

  // Generate answer (in production, use LLM)
  const answer = `Na podlagi razpoložljivih informacij:\n\n${context}\n\nZa več informacij prosimo obiščite uradne turistične strani.`;

  return {
    answer,
    sources: results.map(r => ({ content: r.content, score: r.score })),
  };
}

/**
 * Chunk text into smaller pieces
 */
function chunkText(text: string, maxChunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = end - overlap;
  }

  return chunks;
}

/**
 * Generate embedding (mock - in production use OpenAI)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // In production, call OpenAI embeddings API
  // const response = await openai.embeddings.create({
  //   model: "text-embedding-3-large",
  //   input: text,
  // });
  // return response.data[0].embedding;

  // Mock embedding (1536 dimensions for text-embedding-3-large)
  const embedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  return embedding;
}

/**
 * Initialize knowledge base collection
 */
export async function initializeKnowledgeBase(): Promise<void> {
  try {
    const collections = await qdrantClient.getCollections();
    
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536, // text-embedding-3-large
          distance: "Cosine",
        },
      });

      // Create payload indexes
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "category",
        field_schema: "keyword",
      });

      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "region",
        field_schema: "keyword",
      });

      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "language",
        field_schema: "keyword",
      });
    }
  } catch (error) {
    logger.error("[RAG Init] Error:", error);
  }
}

/**
 * Get knowledge statistics
 */
export async function getKnowledgeStats(): Promise<{
  totalChunks: number;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
  byRegion: Record<string, number>;
}> {
  const chunks = await prisma.knowledgeBase.findMany({
    select: {
      category: true,
      language: true,
      region: true,
    },
  });

  const stats = {
    totalChunks: chunks.length,
    byCategory: {} as Record<string, number>,
    byLanguage: {} as Record<string, number>,
    byRegion: {} as Record<string, number>,
  };

  for (const chunk of chunks) {
    stats.byCategory[chunk.category] = (stats.byCategory[chunk.category] || 0) + 1;
    stats.byLanguage[chunk.language] = (stats.byLanguage[chunk.language] || 0) + 1;
    if (chunk.region) {
      stats.byRegion[chunk.region] = (stats.byRegion[chunk.region] || 0) + 1;
    }
  }

  return stats;
}
