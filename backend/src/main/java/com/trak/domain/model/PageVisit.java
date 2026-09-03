package com.trak.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "page_visit", indexes = {
        @Index(name = "idx_page_visit_session_id", columnList = "session_id"),
        @Index(name = "idx_page_visit_domain", columnList = "domain"),
        @Index(name = "idx_page_visit_url_session", columnList = "url, session_id"),
        @Index(name = "idx_page_visit_normalized_title", columnList = "normalized_title"),
        @Index(name = "idx_page_visit_normalized_domain", columnList = "normalized_domain")
})
public class PageVisit {

    @Id
    private String id;

    @Column(length = 2048, nullable = false)
    private String url;

    @Column(length = 500)
    private String domain;

    @Column(length = 1024)
    private String title;

    @Column(name = "normalized_title", length = 1024)
    private String normalizedTitle;

    @Column(name = "normalized_domain", length = 500)
    private String normalizedDomain;

    @Column(name = "first_visited", nullable = false)
    private Instant firstVisited;

    @Column(name = "last_visited", nullable = false)
    private Instant lastVisited;

    @Column(name = "visit_count", nullable = false)
    private int visitCount = 1;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs = 0;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public PageVisit() {
        this.id = UUID.randomUUID().toString();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getNormalizedTitle() { return normalizedTitle; }
    public void setNormalizedTitle(String normalizedTitle) { this.normalizedTitle = normalizedTitle; }

    public String getNormalizedDomain() { return normalizedDomain; }
    public void setNormalizedDomain(String normalizedDomain) { this.normalizedDomain = normalizedDomain; }
    
    public Instant getFirstVisited() { return firstVisited; }
    public void setFirstVisited(Instant firstVisited) { this.firstVisited = firstVisited; }
    
    public Instant getLastVisited() { return lastVisited; }
    public void setLastVisited(Instant lastVisited) { this.lastVisited = lastVisited; }
    
    public int getVisitCount() { return visitCount; }
    public void setVisitCount(int visitCount) { this.visitCount = visitCount; }
    
    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
