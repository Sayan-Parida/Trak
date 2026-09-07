package com.trak.content;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Canonical result of page content extraction. Produced by a
 * PageContentExtractor, consumed by normalization/chunking. Never null;
 * failures are represented explicitly via status + errorInfo.
 */
public record ExtractedContent(
        String canonicalUrl,
        String sourceUrl,
        String title,
        String mainText,
        List<String> headings,
        Map<String, String> metadata,
        String contentHash,
        Instant extractionTimestamp,
        ExtractionStatus status,
        String errorInfo
) {
    public enum ExtractionStatus {
        SUCCESS,
        FAILED,
        SKIPPED,
        NOT_APPLICABLE
    }
}
