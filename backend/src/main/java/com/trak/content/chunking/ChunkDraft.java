package com.trak.content.chunking;

import java.util.List;

/**
 * Deterministic draft produced by the chunker before persistence.
 * Carries enough metadata to reconstruct context (section path, offsets).
 */
public record ChunkDraft(
        int chunkIndex,
        String sectionPath,
        String content,
        String contentHash,
        int startOffset,
        int endOffset
) {
    public ChunkDraft {
        if (content == null) throw new IllegalArgumentException("content must not be null");
        if (sectionPath == null) sectionPath = "";
    }

    public static String sectionPathOf(List<String> headings) {
        if (headings == null || headings.isEmpty()) return "";
        return String.join(" / ", headings);
    }
}
