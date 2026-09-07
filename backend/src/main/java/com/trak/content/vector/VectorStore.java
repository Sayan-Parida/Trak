package com.trak.content.vector;

import java.util.List;
import java.util.Map;

/**
 * Vector storage abstraction. Business/product code depends ONLY on this.
 * Production: PgVectorStore (PostgreSQL + pgvector native similarity).
 * Dev/test: SqliteVectorStore (metadata filtering in SQL, cosine in Java;
 * explicitly NOT the production vector architecture).
 */
public interface VectorStore {

    /** Backend identifier: "pgvector" or "sqlite". */
    String backend();

    /** Insert or replace the vector for a chunk id. */
    void upsert(String chunkId, float[] vector, Map<String, String> metadata);

    /** Delete a stored vector. */
    void deleteById(String chunkId);

    /**
     * Similarity search with metadata pre-filtering. Returns chunk ids
     * ordered by descending similarity, at most limit entries.
     */
    List<ScoredId> similaritySearch(float[] queryVector, Map<String, String> filter, int limit);

    /** Scored chunk reference. */
    record ScoredId(String chunkId, double score) {}
}
