package com.researchmind.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "search_query", indexes = {
        @Index(name = "idx_search_query_session_id", columnList = "session_id"),
        @Index(name = "idx_search_query_timestamp", columnList = "timestamp")
})
public class SearchQuery {

    @Id
    private String id;

    @Column(name = "query_text", length = 1024, nullable = false)
    private String queryText;

    @Column(length = 50, nullable = false)
    private String engine;

    @Column(name = "source_url", length = 2048, nullable = false)
    private String sourceUrl;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "page_visit_id")
    private String pageVisitId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public SearchQuery() {
        this.id = UUID.randomUUID().toString();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getQueryText() { return queryText; }
    public void setQueryText(String queryText) { this.queryText = queryText; }
    
    public String getEngine() { return engine; }
    public void setEngine(String engine) { this.engine = engine; }
    
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    
    public String getPageVisitId() { return pageVisitId; }
    public void setPageVisitId(String pageVisitId) { this.pageVisitId = pageVisitId; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
