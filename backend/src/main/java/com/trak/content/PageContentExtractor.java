package com.trak.content;

import java.time.Instant;

/**
 * Replaceable content-extraction abstraction. The backend remains the
 * canonical content-processing pipeline; the extension only acquires
 * privacy-gated HTML and never implements independent semantic extraction.
 */
public interface PageContentExtractor {

    /** Unique name, e.g. "jsoup-standard". Stored on ContentVersion.extractorUsed. */
    String name();

    /** Human-readable description. */
    String description();

    /**
     * Extract content from raw HTML. Never returns null; failures use
     * ExtractedContent with status FAILED/SKIPPED/NOT_APPLICABLE.
     */
    ExtractedContent extract(String url, String html, Instant capturedAt);
}
