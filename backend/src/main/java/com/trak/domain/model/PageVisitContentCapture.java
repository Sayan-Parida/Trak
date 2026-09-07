package com.trak.domain.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Explicit association between a PageVisit event and the captured content
 * observed during that visit. Multiple visits may reference the same
 * ContentDocument/ContentVersion without duplicating content:
 *   Visit A -> Document X -> Version 1
 *   Visit B -> Document X -> Version 1
 *   Visit C -> Document X -> Version 2
 */
@Entity
@Table(name = "page_visit_content_capture", indexes = {
        @Index(name = "idx_pvcc_visit", columnList = "page_visit_id"),
        @Index(name = "idx_pvcc_document", columnList = "content_document_id"),
        @Index(name = "idx_pvcc_version", columnList = "content_version_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_pvcc_visit", columnNames = "page_visit_id")
})
public class PageVisitContentCapture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "page_visit_id", nullable = false)
    private String pageVisitId;

    @Column(name = "content_document_id", nullable = false)
    private String contentDocumentId;

    @Column(name = "content_version_id")
    private String contentVersionId;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;

    @Column(name = "capture_method", length = 40, nullable = false)
    private String captureMethod = "MANUAL";

    @Column(length = 30, nullable = false)
    private String status = "SUCCESS";

    @Column(name = "dwell_time_seconds")
    private Long dwellTimeSeconds;

    @Column(name = "error_info", length = 1024)
    private String errorInfo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPageVisitId() { return pageVisitId; }
    public void setPageVisitId(String pageVisitId) { this.pageVisitId = pageVisitId; }

    public String getContentDocumentId() { return contentDocumentId; }
    public void setContentDocumentId(String contentDocumentId) { this.contentDocumentId = contentDocumentId; }

    public String getContentVersionId() { return contentVersionId; }
    public void setContentVersionId(String contentVersionId) { this.contentVersionId = contentVersionId; }

    public Instant getCapturedAt() { return capturedAt; }
    public void setCapturedAt(Instant capturedAt) { this.capturedAt = capturedAt; }

    public String getCaptureMethod() { return captureMethod; }
    public void setCaptureMethod(String captureMethod) { this.captureMethod = captureMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getDwellTimeSeconds() { return dwellTimeSeconds; }
    public void setDwellTimeSeconds(Long dwellTimeSeconds) { this.dwellTimeSeconds = dwellTimeSeconds; }

    public String getErrorInfo() { return errorInfo; }
    public void setErrorInfo(String errorInfo) { this.errorInfo = errorInfo; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
