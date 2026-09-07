package com.trak.content.chunking;

import com.trak.content.ExtractedContent;
import java.util.List;

/**
 * Semantic, section-aware chunking abstraction. Implementations MUST be
 * deterministic: same input -> same chunks. Never one-heading-equals-one-chunk
 * blindly; sections are split by max size with controlled overlap.
 */
public interface ResearchContentChunker {

    /** Chunk extracted content using configured max size / overlap. */
    List<ChunkDraft> chunk(ExtractedContent content);

    /** Chunk with explicit bounds (chars). */
    List<ChunkDraft> chunk(ExtractedContent content, int maxChunkChars, int overlapChars);
}
