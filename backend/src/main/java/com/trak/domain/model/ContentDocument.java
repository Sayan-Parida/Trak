package com.trak.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Captured representation of a Page (identified by canonical URL).
 * Distinct from PageVisit (an event). Multiple visits may reference
 * the same ContentDocument via PageVisitContentCapture without duplicating content.
 */
@Entity
@Table(name = "content_document", indexes = {
        @Index(name = "idx_content_document_canonical", columnList = "canonical_url"),
        @Index(name = "idx_content_document_hash", columnList = "content_hash"),
        @Index(name = "idx_content_document_domain", columnList = "domain")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_content_document_canonical", columnNames = "canonical_url")
})
public class ContentDocument {

    @Id
    private String id;

    @Column(name = "canonical_url", length = 2048, nullable = false)
    private String canonicalUrl;

    @Column(name = "source_url", length = 2048)
    private String sourceUrl;

    @Column(length = 1024)
    private String title;

    @Column(length = 500)
    private String domain;

    /**
     * SHA-256 of normalized main text (content identity only; NOT mixed with URL).
     * Canonical URL carries page identity separately.
     */
    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "extraction_status", length = 30, nullable = false)
    private String extractionStatus = "NOT_EXTRACTED";

    @Column(name = "last_extracted_at")
    private Instant lastExtractedAt;

    @Column(name = "capture_count", nullable = false)
    private int captureCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ContentDocument() {
        this.id = UUID.randomUUID().toString();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCanonicalUrl() { return canonicalUrl; }
    public void setCanonicalUrl(String canonicalUrl) { this.canonicalUrl = canonicalUrl; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public String getExtractionStatus() { return extractionStatus; }
    public void setExtractionStatus(String extractionStatus) { this.extractionStatus = extractionStatus; }

    public Instant getLastExtractedAt() { return lastExtractedAt; }
    public void setLastExtractedAt(Instant lastExtractedAt) { this.lastExtractedAt = lastExtractedAt; }

    public int getCaptureCount() { return captureCount; }
    public void setCaptureCount(int captureCount) { this.captureCount = captureCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
