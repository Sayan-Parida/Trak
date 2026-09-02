package com.researchmind.api.dto;

import java.time.Instant;

public record PageVisitResponse(
        String id,
        String url,
        String domain,
        String title,
        Instant firstVisited,
        Instant lastVisited,
        int visitCount,
        long durationMs
) {
}
