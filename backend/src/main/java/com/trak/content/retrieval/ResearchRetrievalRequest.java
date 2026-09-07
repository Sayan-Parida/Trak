package com.trak.content.retrieval;

import java.time.Instant;
import java.util.Optional;

/**
 * Research-aware retrieval request. All filters optional except query/limit.
 * Extensible without breaking the API: new context fields are added here,
 * never as new positional service arguments.
 */
public record ResearchRetrievalRequest(
        String query,
        String sessionId,
        String domain,
        Instant timeFrom,
        Instant timeTo,
        int limit,
        Optional<String> sourceContentDocumentId,
        Optional<String> searchId,
        Optional<String> contentHash,
        RetrievalPriority priority
) {
    public enum RetrievalPriority {
        SEMANTIC,
        RECENT,
        SOURCE_DEDUP
    }

    public ResearchRetrievalRequest {
        if (limit <= 0) limit = 10;
        if (limit > 100) limit = 100;
        if (sourceContentDocumentId == null) sourceContentDocumentId = Optional.empty();
        if (searchId == null) searchId = Optional.empty();
        if (contentHash == null) contentHash = Optional.empty();
        if (priority == null) priority = RetrievalPriority.SEMANTIC;
    }

    public static ResearchRetrievalRequest of(String query, String sessionId, String domain,
                                              Instant timeFrom, Instant timeTo, int limit) {
        return new ResearchRetrievalRequest(query, sessionId, domain, timeFrom, timeTo, limit,
                Optional.empty(), Optional.empty(), Optional.empty(), RetrievalPriority.SEMANTIC);
    }
}
