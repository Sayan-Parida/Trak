package com.researchmind.api.dto;

import java.time.Instant;

public record SearchQueryResponse(
        String id,
        String queryText,
        String engine,
        String sourceUrl,
        Instant timestamp
) {
}
