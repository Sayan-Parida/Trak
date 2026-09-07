package com.trak.content.retrieval;

import java.time.Instant;
import java.util.List;

/**
 * Retrieval result with full provenance. A future AI answer can explain
 * session -> search -> page visit -> content version -> chunk -> evidence.
 */
public record RetrievedResearchContent(
        String chunkId,
        String content,
        Double similarityScore,
        Provenance provenance,
        String extractionMethod,
        Instant extractedAt
) {
    public record Provenance(
            String contentDocumentId,
            String contentVersionId,
            String pageVisitId,
            String searchId,
            String sessionId,
            String domain,
            String canonicalUrl,
            String sourceUrl,
            String title,
            Instant pageVisitedAt,
            Instant extractedAt,
            List<String> sourceTags
    ) {}
}
