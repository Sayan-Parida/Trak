package com.trak.content;

import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

/**
 * Creates M5 content tables when ddl-auto=none (production SQLite file).
 * Tests use ddl-auto=create-drop so JPA creates them automatically; this
 * initializer is idempotent (IF NOT EXISTS) and safe to run in both.
 * PostgreSQL branch uses BIGSERIAL + pgvector extension; SQLite uses
 * AUTOINCREMENT + TEXT. No existing M1-M4 tables are modified.
 */
@Component
public class ContentSchemaInitializer {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public ContentSchemaInitializer(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void init() {
        boolean postgres = isPostgres();
        if (postgres) {
            try {
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
            } catch (Exception ignored) {
            }
        }
        String idPk = postgres ? "BIGSERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS content_document (" +
                "id TEXT PRIMARY KEY, canonical_url VARCHAR(2048) NOT NULL, " +
                "source_url VARCHAR(2048), title VARCHAR(1024), domain VARCHAR(500), " +
                "content_hash VARCHAR(64), extraction_status VARCHAR(30) NOT NULL, " +
                "last_extracted_at TIMESTAMP, capture_count INTEGER NOT NULL, " +
                "created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL)");
        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_content_document_canonical ON content_document (canonical_url)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_content_document_hash ON content_document (content_hash)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_content_document_domain ON content_document (domain)");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS content_version (" +
                "id TEXT PRIMARY KEY, content_document_id TEXT NOT NULL, version INTEGER NOT NULL, " +
                "content_hash VARCHAR(64) NOT NULL, main_text TEXT, extractor_used VARCHAR(100), " +
                "extracted_at TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL)");
        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_content_version_doc_version ON content_version (content_document_id, version)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_content_version_document ON content_version (content_document_id)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_content_version_hash ON content_version (content_hash)");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS content_chunk (" +
                "id TEXT PRIMARY KEY, content_version_id TEXT NOT NULL, chunk_index INTEGER NOT NULL, " +
                "section_path VARCHAR(2048), content TEXT NOT NULL, content_hash VARCHAR(64), " +
                "start_offset INTEGER NOT NULL, end_offset INTEGER NOT NULL, created_at TIMESTAMP NOT NULL)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_content_chunk_version ON content_chunk (content_version_id)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_content_chunk_hash ON content_chunk (content_hash)");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS research_content_embedding (" +
                "id " + idPk + ", content_chunk_id TEXT NOT NULL, vector_text TEXT, " +
                "model_name VARCHAR(200) NOT NULL, model_version VARCHAR(100), dimension INTEGER NOT NULL, " +
                "status VARCHAR(40) NOT NULL, error_code VARCHAR(100), error_message VARCHAR(1024), " +
                "created_at TIMESTAMP NOT NULL)");
        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_rce_chunk ON research_content_embedding (content_chunk_id)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_rce_status ON research_content_embedding (status)");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS page_visit_content_capture (" +
                "id " + idPk + ", page_visit_id TEXT NOT NULL, content_document_id TEXT NOT NULL, " +
                "content_version_id TEXT, captured_at TIMESTAMP NOT NULL, capture_method VARCHAR(40) NOT NULL, " +
                "status VARCHAR(30) NOT NULL, dwell_time_seconds BIGINT, error_info VARCHAR(1024), " +
                "created_at TIMESTAMP NOT NULL)");
        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_pvcc_visit ON page_visit_content_capture (page_visit_id)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_pvcc_document ON page_visit_content_capture (content_document_id)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_pvcc_version ON page_visit_content_capture (content_version_id)");
    }

    private boolean isPostgres() {
        try {
            String url = dataSource.getConnection().getMetaData().getURL();
            return url != null && url.startsWith("jdbc:postgresql");
        } catch (Exception e) {
            return false;
        }
    }
}
