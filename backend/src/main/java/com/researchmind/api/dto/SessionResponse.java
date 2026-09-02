package com.researchmind.api.dto;

import java.time.Instant;

public record SessionResponse(
        String id,
        String title,
        String status,
        Instant startTime,
        Instant endTime,
        long eventCount,
        long pageCount,
        long searchCount
) {
}
