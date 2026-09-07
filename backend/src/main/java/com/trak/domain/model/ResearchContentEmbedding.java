package com.trak.domain.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Vector representation of a ContentChunk plus explicit embedding status.
 * CONTENT_EXTRACTED but EMBEDDING_FAILED is representable and never
 * silently treated as success.
 */
@Entity
@Table(name = "research_content_embedding", indexes = {
        @Index(name = "idx_rce_chunk", columnList = "content_chunk_id"),
        @Index(name = "idx_rce_status", columnList = "status"),
        @Index(name = "idx_rce_model", columnList = "model_name")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_rce_chunk", columnNames = "content_chunk_id")
})
public class ResearchContentEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_chunk_id", nullable = false)
    private String contentChunkId;

    /**
     * Portable vector encoding "[0.1,0.2,...]". On PostgreSQL+pgvector the
     * PgVectorStore casts this TEXT to vector for native similarity search;
     * on SQLite/dev the SqliteVectorStore parses it in Java. One column,
     * two query paths, no disposable schema.
     */
    @Column(name = "vector_text", columnDefinition = "TEXT")
    private String vectorText;

    @Column(name = "model_name", length = 200, nullable = false)
    private String modelName;

    @Column(name = "model_version", length = 100)
    private String modelVersion;

    @Column(nullable = false)
    private int dimension;

    @Column(length = 40, nullable = false)
    private String status = "PENDING";

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Column(name = "error_message", length = 1024)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContentChunkId() { return contentChunkId; }
    public void setContentChunkId(String contentChunkId) { this.contentChunkId = contentChunkId; }

    public String getVectorText() { return vectorText; }
    public void setVectorText(String vectorText) { this.vectorText = vectorText; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public int getDimension() { return dimension; }
    public void setDimension(int dimension) { this.dimension = dimension; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
