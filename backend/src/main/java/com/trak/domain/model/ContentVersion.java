package com.trak.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Historical state of a ContentDocument at a particular extraction time.
 * New version is created only when contentHash changes; revisits with
 * identical content reuse the existing version (no duplication).
 */
@Entity
@Table(name = "content_version", indexes = {
        @Index(name = "idx_content_version_document", columnList = "content_document_id"),
        @Index(name = "idx_content_version_hash", columnList = "content_hash")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_content_version_doc_version", columnNames = {"content_document_id", "version"})
})
public class ContentVersion {

    @Id
    private String id;

    @Column(name = "content_document_id", nullable = false)
    private String contentDocumentId;

    @Column(nullable = false)
    private int version;

    @Column(name = "content_hash", length = 64, nullable = false)
    private String contentHash;

    @Column(name = "main_text", columnDefinition = "TEXT")
    private String mainText;

    @Column(name = "extractor_used", length = 100)
    private String extractorUsed;

    @Column(name = "extracted_at", nullable = false)
    private Instant extractedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ContentVersion() {
        this.id = UUID.randomUUID().toString();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getContentDocumentId() { return contentDocumentId; }
    public void setContentDocumentId(String contentDocumentId) { this.contentDocumentId = contentDocumentId; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public String getMainText() { return mainText; }
    public void setMainText(String mainText) { this.mainText = mainText; }

    public String getExtractorUsed() { return extractorUsed; }
    public void setExtractorUsed(String extractorUsed) { this.extractorUsed = extractorUsed; }

    public Instant getExtractedAt() { return extractedAt; }
    public void setExtractedAt(Instant extractedAt) { this.extractedAt = extractedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
