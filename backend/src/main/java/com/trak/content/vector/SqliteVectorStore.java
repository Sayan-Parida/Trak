package com.trak.content.vector;

import com.trak.domain.model.ResearchContentEmbedding;
import com.trak.domain.repository.ResearchContentEmbeddingRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Dev/test vector store for SQLite (and any non-Postgres datasource).
 * Metadata filtering happens at the retrieval layer; similarity is computed
 * in Java over parsed vectors. Explicitly NOT the production vector
 * architecture — production uses PgVectorStore (PostgreSQL + pgvector).
 */
@Component
public class SqliteVectorStore implements VectorStore {

    private final ResearchContentEmbeddingRepository embeddingRepository;

    public SqliteVectorStore(ResearchContentEmbeddingRepository embeddingRepository) {
        this.embeddingRepository = embeddingRepository;
    }

    @Override
    public String backend() {
        return "sqlite";
    }

    @Override
    public void upsert(String chunkId, float[] vector, Map<String, String> metadata) {
        // No-op hook: embedding rows are JPA-managed by ResearchContentService
        // (single writer). Similarity reads the same table below. On SQLite
        // there is no separate vector index to maintain.
    }

    @Override
    public void deleteById(String chunkId) {
        // No-op hook: deletes go through ResearchContentEmbeddingRepository.
    }

    @Override
    public List<ScoredId> similaritySearch(float[] queryVector, Map<String, String> filter, int limit) {
        List<ResearchContentEmbedding> all = embeddingRepository.findByStatus("SUCCESS");
        List<ScoredId> scored = new ArrayList<>();
        for (ResearchContentEmbedding emb : all) {
            float[] vec = VectorMath.parse(emb.getVectorText());
            if (vec == null || queryVector == null || vec.length != queryVector.length) continue;
            double score = VectorMath.cosineSimilarity(queryVector, vec);
            scored.add(new ScoredId(emb.getContentChunkId(), score));
        }
        scored.sort(Comparator.comparingDouble(ScoredId::score).reversed());
        return scored.subList(0, Math.min(Math.max(1, limit), scored.size()));
    }
}
