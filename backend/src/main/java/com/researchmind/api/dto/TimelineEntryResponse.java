package com.researchmind.api.dto;

import java.time.Instant;
import java.util.Map;

public record TimelineEntryResponse(
        String id,
        String type, // EVENT or SEARCH
        Instant timestamp,
        String title,
        String url,
        Map<String, Object> details
) {
}
