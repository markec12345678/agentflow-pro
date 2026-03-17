-- Migration: Add pgvector for Semantic Memory
-- Created: 2026-03-17
-- Description: Enables vector similarity search for semantic memory

-- Enable pgvector extension
-- Note: For Supabase, enable via Dashboard → Database → Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Create semantic memory table with vector embeddings
CREATE TABLE IF NOT EXISTS "semantic_memories" (
    "id" TEXT PRIMARY KEY DEFAULT 'sm_' || REPLACE(gen_random_uuid()::text, '-', ''),
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "workflow_id" TEXT,
    "agent_id" TEXT,
    "collection" TEXT NOT NULL DEFAULT 'general',
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "embedding" vector(1536), -- OpenAI ada-002 dimensions
    "metadata" JSONB DEFAULT '{}',
    "tags" TEXT[] DEFAULT '{}',
    "access_count" INTEGER DEFAULT 0,
    "last_accessed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search (IVFFlat for large datasets)
CREATE INDEX IF NOT EXISTS "semantic_memories_embedding_idx" 
ON "semantic_memories" 
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);

-- Create index for collection filtering
CREATE INDEX IF NOT EXISTS "semantic_memories_collection_idx" 
ON "semantic_memories" ("collection");

-- Create index for session filtering
CREATE INDEX IF NOT EXISTS "semantic_memories_session_idx" 
ON "semantic_memories" ("session_id");

-- Create index for content hash (deduplication)
CREATE INDEX IF NOT EXISTS "semantic_memories_content_hash_idx" 
ON "semantic_memories" ("content_hash");

-- Create index for tags (array containment)
CREATE INDEX IF NOT EXISTS "semantic_memories_tags_idx" 
ON "semantic_memories" USING GIN ("tags");

-- Create index for created_at (time-based queries)
CREATE INDEX IF NOT EXISTS "semantic_memories_created_at_idx" 
ON "semantic_memories" ("created_at" DESC);

-- Create composite index for collection + similarity
CREATE INDEX IF NOT EXISTS "semantic_memories_collection_embedding_idx" 
ON "semantic_memories" ("collection", "embedding" vector_cosine_ops);

-- Create function to update last_accessed_at and access_count
CREATE OR REPLACE FUNCTION update_semantic_memory_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed_at = CURRENT_TIMESTAMP;
    NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for access tracking
CREATE TRIGGER "semantic_memories_access_trigger"
BEFORE UPDATE ON "semantic_memories"
FOR EACH ROW
WHEN (OLD.id IS DISTINCT FROM NEW.id OR OLD.embedding IS DISTINCT FROM NEW.embedding)
EXECUTE FUNCTION update_semantic_memory_access();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER "semantic_memories_updated_at_trigger"
BEFORE UPDATE ON "semantic_memories"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function for similarity search
CREATE OR REPLACE FUNCTION search_similar_memories(
    query_embedding vector(1536),
    match_collection TEXT DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    "id" TEXT,
    "session_id" TEXT,
    "user_id" TEXT,
    "workflow_id" TEXT,
    "agent_id" TEXT,
    "collection" TEXT,
    "content" TEXT,
    "metadata" JSONB,
    "tags" TEXT[],
    "similarity" FLOAT,
    "created_at" TIMESTAMP,
    "last_accessed_at" TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sm."id",
        sm."session_id",
        sm."user_id",
        sm."workflow_id",
        sm."agent_id",
        sm."collection",
        sm."content",
        sm."metadata",
        sm."tags",
        (sm."embedding" <=> query_embedding) AS "similarity",
        sm."created_at",
        sm."last_accessed_at"
    FROM "semantic_memories" sm
    WHERE 
        (match_collection IS NULL OR sm."collection" = match_collection)
        AND (sm."embedding" <=> query_embedding) < (1 - match_threshold)
    ORDER BY sm."embedding" <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create function for hybrid search (similarity + metadata filtering)
CREATE OR REPLACE FUNCTION hybrid_search_memories(
    query_embedding vector(1536),
    match_collection TEXT DEFAULT NULL,
    match_tags TEXT[] DEFAULT NULL,
    match_metadata JSONB DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    "id" TEXT,
    "session_id" TEXT,
    "user_id" TEXT,
    "workflow_id" TEXT,
    "agent_id" TEXT,
    "collection" TEXT,
    "content" TEXT,
    "metadata" JSONB,
    "tags" TEXT[],
    "similarity" FLOAT,
    "created_at" TIMESTAMP,
    "last_accessed_at" TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sm."id",
        sm."session_id",
        sm."user_id",
        sm."workflow_id",
        sm."agent_id",
        sm."collection",
        sm."content",
        sm."metadata",
        sm."tags",
        (sm."embedding" <=> query_embedding) AS "similarity",
        sm."created_at",
        sm."last_accessed_at"
    FROM "semantic_memories" sm
    WHERE 
        (match_collection IS NULL OR sm."collection" = match_collection)
        AND (match_tags IS NULL OR sm."tags" && match_tags)
        AND (match_metadata IS NULL OR sm."metadata" @> match_metadata)
        AND (sm."embedding" <=> query_embedding) < (1 - match_threshold)
    ORDER BY sm."embedding" <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create view for memory statistics
CREATE OR REPLACE VIEW "semantic_memory_stats" AS
SELECT
    "collection",
    COUNT(*) as "total_memories",
    COUNT(DISTINCT "session_id") as "unique_sessions",
    COUNT(DISTINCT "user_id") as "unique_users",
    AVG("access_count") as "avg_access_count",
    MAX("created_at") as "last_created",
    SUM(pg_column_size("embedding")) as "total_embedding_size"
FROM "semantic_memories"
GROUP BY "collection";

-- Add comments for documentation
COMMENT ON TABLE "semantic_memories" IS 'Semantic memory storage with vector embeddings for similarity search';
COMMENT ON COLUMN "semantic_memories"."embedding" IS 'OpenAI ada-002 embedding (1536 dimensions)';
COMMENT ON COLUMN "semantic_memories"."content_hash" IS 'SHA256 hash of content for deduplication';
COMMENT ON COLUMN "semantic_memories"."collection" IS 'Logical grouping (e.g., workflows, agents, knowledge)';
COMMENT ON COLUMN "semantic_memories"."metadata" IS 'Flexible JSON metadata for additional context';
COMMENT ON FUNCTION "search_similar_memories" IS 'Search for similar memories by vector similarity';
COMMENT ON FUNCTION "hybrid_search_memories" IS 'Hybrid search with similarity + metadata filtering';

-- Grant permissions (adjust for your setup)
-- GRANT ALL ON "semantic_memories" TO postgres;
-- GRANT ALL ON "semantic_memories" TO authenticated; -- For Supabase

-- Insert sample data for testing (optional)
-- INSERT INTO "semantic_memories" ("session_id", "collection", "content", "content_hash", "embedding")
-- VALUES (
--     'session-test-1',
--     'general',
--     'This is a test memory about hotel descriptions',
--     sha256('This is a test memory about hotel descriptions'),
--     -- Replace with actual embedding vector
--     '[0.1, 0.2, 0.3, ...]'::vector
-- );
