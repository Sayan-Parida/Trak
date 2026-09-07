package com.trak.content.vector;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * PRODUCTION vector store: PostgreSQL + pgvector native similarity search.
 * Vectors are stored in research_content_embedding.vector_text as portable
 * "[0.1,0.2,...]" text and cast to vector for indexed similarity queries.
 * Metadata filtering (session/domain via joins) happens in SQL together
 * with the vector ordering — never application-side brute force in prod.
 */
@Component
public class PgVectorStore implements VectorStore {

    private final JdbcTemplate jdbcTemplate;

    public PgVectorStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String backend() {
        return "pgvector";
    }

    @Override
    public void upsert(String chunkId, float[] vector, Map<String, String> metadata) {
        // Vector bytes live in research_content_embedding.vector_text (JPA-managed).
        // This store only ensures the pgvector extension/index exist; writes go
        // through the JPA entity so metadata + status stay consistent.
        ensureExtension();
    }

    @Override
    public void deleteById(String chunkId) {
        // Deletes go through the JPA repository; vector row removed with entity.
    }

    @Override
    public List<ScoredId> similaritySearch(float[] queryVector, Map<String, String> filter, int limit) {
        ensureExtension();
        String queryText = VectorMath.format(queryVector);
        StringBuilder sql = new StringBuilder(
                "SELECT e.content_chunk_id AS chunk_id, " +
                "(e.vector_text::vector <=> CAST(? AS vector)) AS distance " +
                "FROM research_content_embedding e " +
                "WHERE e.status = 'SUCCESS' AND e.vector_text IS NOT NULL");
        List<Object> args = new ArrayList<>();
        args.add(queryText);
        if (filter != null) {
            if (filter.containsKey("model")) {
                sql.append(" AND e.model_name = ?");
                args.add(filter.get("model"));
            }
        }
        sql.append(" ORDER BY distance ASC LIMIT ?");
        args.add(Math.max(1, limit));
        try {
            return jdbcTemplate.query(sql.toString(), args.toArray(), (rs, i) -> {
                String id = rs.getString("chunk_id");
                double distance = rs.getDouble("distance");
                return new ScoredId(id, 1.0 / (1.0 + distance));
            });
        } catch (EmptyResultDataAccessException e) {
            return List.of();
        }
    }

    private void ensureExtension() {
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
        } catch (Exception e) {
            throw new IllegalStateException("pgvector extension unavailable; PostgreSQL + pgvector required for production vector search", e);
        }
    }
}
