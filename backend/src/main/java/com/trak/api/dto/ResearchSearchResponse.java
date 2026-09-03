package com.trak.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ResearchSearchResponse(
        String query,
        String normalizedQuery,
        int totalResults,
        List<ResearchResult> results
) {
    public record ResearchResult(
            String id,
            String type,
            String label,
            String sessionId,
            Instant timestamp,
            String url,
            String domain,
            int visitCount,
            double score,
            double importanceScore,
            List<String> matchedTerms,
            List<String> reasons,
            Map<String, Object> metadata,
            List<GraphContext> graphContext
    ) {}

    public record GraphContext(
            String source,
            String target,
            String relationshipType,
            String reason
    ) {}
}
