/**
 * AgentFlow Pro - Qdrant Vector Service
 * Semantic search over documents. Graceful fallback when not configured.
 */

import { QdrantClient } from "@qdrant/qdrant-js";

const COLLECTION = "agentflow_docs";
const EMBEDDING_DIM = 1536;

let _client: QdrantClient | null = null;

function getClient(): QdrantClient | null {
  const url = process.env.QDRANT_URL?.trim();
  const apiKey = process.env.QDRANT_API_KEY?.trim();
  if (!url) return null;
  try {
    if (!_client) {
      _client = new QdrantClient({
        url,
        apiKey: apiKey || undefined,
      });
    }
    return _client;
  } catch {
    return null;
  }
}

async function embed(text: string, openaiKey: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });
  if (!res.ok) throw new Error("Embedding failed");
  const json = (await res.json()) as { data?: { embedding?: number[] }[] };
  const vec = json.data?.[0]?.embedding;
  if (!vec) throw new Error("No embedding returned");
  return vec;
}

export async function ensureCollection(): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const collections = await client.getCollections();
    const exists = collections.collections?.some((c) => c.name === COLLECTION);
    if (!exists) {
      await client.createCollection(COLLECTION, {
        vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
      });
    }
    return true;
  } catch {
    return false;
  }
}

export interface IndexDocument {
  id: string;
  text: string;
  metadata?: Record<string, string | number>;
}

export async function indexDocuments(
  documents: IndexDocument[],
  openaiKey: string
): Promise<{ indexed: number; error?: string }> {
  const client = getClient();
  if (!client) return { indexed: 0, error: "Qdrant not configured" };

  await ensureCollection();

  const points = await Promise.all(
    documents.map(async (doc) => {
      const vector = await embed(doc.text, openaiKey);
      return {
        id: doc.id,
        vector,
        payload: {
          text: doc.text,
          ...doc.metadata,
        },
      };
    })
  );

  await client.upsert(COLLECTION, {
    wait: true,
    points,
  });
  return { indexed: documents.length };
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata?: Record<string, unknown>;
}

export async function search(
  query: string,
  openaiKey: string,
  limit = 5
): Promise<SearchResult[]> {
  const client = getClient();
  if (!client) return [];

  const vector = await embed(query, openaiKey);
  const results = await client.search(COLLECTION, {
    vector,
    limit,
    with_payload: true,
  });

  return results.map((r) => ({
    id: String(r.id),
    score: r.score ?? 0,
    text: String((r.payload as { text?: string })?.text ?? ""),
    metadata: r.payload as Record<string, unknown>,
  }));
}
