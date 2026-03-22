import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

/**
 * QdrantService - Vector service tests with mocked Qdrant and fetch
 */
import {
  ensureCollection,
  indexDocuments,
  search,
  type IndexDocument,
} from "@/vector/QdrantService";

const mockGetCollections = vi.fn();
const mockCreateCollection = vi.fn();
const mockUpsert = vi.fn();
const mockSearch = vi.fn();

const mockClient = {
  getCollections: mockGetCollections,
  createCollection: mockCreateCollection,
  upsert: mockUpsert,
  search: mockSearch,
};

vi.mock("@qdrant/qdrant-js", () => ({
  QdrantClient: vi.fn().mockImplementation(() => mockClient),
}));

const origFetch = global.fetch;

describe("QdrantService", () => {
  const origEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...origEnv };
    (global as { fetch?: typeof fetch }).fetch = origFetch;
  });

  afterAll(() => {
    process.env = origEnv;
  });

  describe("when QDRANT_URL not set", () => {
    beforeEach(() => {
      delete process.env.QDRANT_URL;
      process.env.QDRANT_URL = "";
    });

    it("ensureCollection returns false", async () => {
      const result = await ensureCollection();
      expect(result).toBe(false);
      expect(mockGetCollections).not.toHaveBeenCalled();
    });

    it("indexDocuments returns indexed 0 with error", async () => {
      const result = await indexDocuments(
        [{ id: "d1", text: "hello" }],
        "sk-test"
      );
      expect(result).toEqual({ indexed: 0, error: "Qdrant not configured" });
    });

    it("search returns empty array", async () => {
      const result = await search("query", "sk-test");
      expect(result).toEqual([]);
    });
  });

  describe("when QDRANT_URL is set", () => {
    beforeEach(() => {
      process.env.QDRANT_URL = "http://qdrant:6333";
      (global as { fetch?: typeof fetch }).fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ embedding: new Array(1536).fill(0.1) }],
          }),
      }) as jest.Mock;
    });

    it("ensureCollection returns true when collection exists", async () => {
      mockGetCollections.mockResolvedValue({
        collections: [{ name: "agentflow_docs" }],
      });
      const result = await ensureCollection();
      expect(result).toBe(true);
      expect(mockCreateCollection).not.toHaveBeenCalled();
    });

    it("ensureCollection creates collection when missing", async () => {
      mockGetCollections.mockResolvedValue({ collections: [] });
      mockCreateCollection.mockResolvedValue(undefined);
      const result = await ensureCollection();
      expect(result).toBe(true);
      expect(mockCreateCollection).toHaveBeenCalledWith(
        "agentflow_docs",
        expect.objectContaining({
          vectors: { size: 1536, distance: "Cosine" },
        })
      );
    });

    it("indexDocuments embeds and upserts", async () => {
      mockGetCollections.mockResolvedValue({
        collections: [{ name: "agentflow_docs" }],
      });
      mockUpsert.mockResolvedValue(undefined);

      const docs: IndexDocument[] = [
        { id: "d1", text: "Hello world", metadata: { type: "test" } },
      ];
      const result = await indexDocuments(docs, "sk-key");

      expect(result).toEqual({ indexed: 1 });
      expect(mockUpsert).toHaveBeenCalledWith(
        "agentflow_docs",
        expect.objectContaining({
          wait: true,
          points: expect.arrayContaining([
            expect.objectContaining({
              id: "d1",
              vector: expect.any(Array),
              payload: expect.objectContaining({
                text: "Hello world",
                type: "test",
              }),
            }),
          ]),
        })
      );
    });

    it("search returns mapped results", async () => {
      mockSearch.mockResolvedValue([
        {
          id: "d1",
          score: 0.95,
          payload: { text: "Hello", type: "doc" },
        },
      ]);

      const results = await search("query", "sk-key", 3);

      expect(results).toEqual([
        {
          id: "d1",
          score: 0.95,
          text: "Hello",
          metadata: { text: "Hello", type: "doc" },
        },
      ]);
      expect(mockSearch).toHaveBeenCalledWith(
        "agentflow_docs",
        expect.objectContaining({
          limit: 3,
          with_payload: true,
        })
      );
    });
  });
});
