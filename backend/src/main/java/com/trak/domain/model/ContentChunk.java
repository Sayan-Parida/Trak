package com.trak.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Semantic unit derived from a ContentVersion. Retains enough metadata
 * to reconstruct context (section path, order, offsets) and provenance.
 */
@Entity
@Table(name = "content_chunk", indexes = {
        @Index(name = "idx_content_chunk_version", columnList = "content_version_id"),
        @Index(name = "idx_content_chunk_hash", columnList = "content_hash")
})
public class ContentChunk {

    @Id
    private String id;

    @Column(name = "content_version_id", nullable = false)
    private String contentVersionId;

    @Column(name = "chunk_index", nullable = false)
    private int chunkIndex;

    @Column(name = "section_path", length = 2048)
    private String sectionPath;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "start_offset", nullable = false)
    private int startOffset = 0;

    @Column(name = "end_offset", nullable = false)
    private int endOffset = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ContentChunk() {
        this.id = UUID.randomUUID().toString();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getContentVersionId() { return contentVersionId; }
    public void setContentVersionId(String contentVersionId) { this.contentVersionId = contentVersionId; }

    public int getChunkIndex() { return chunkIndex; }
    public void setChunkIndex(int chunkIndex) { this.chunkIndex = chunkIndex; }

    public String getSectionPath() { return sectionPath; }
    public void setSectionPath(String sectionPath) { this.sectionPath = sectionPath; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public int getStartOffset() { return startOffset; }
    public void setStartOffset(int startOffset) { this.startOffset = startOffset; }

    public int getEndOffset() { return endOffset; }
    public void setEndOffset(int endOffset) { this.endOffset = endOffset; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
