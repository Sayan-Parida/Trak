package com.trak.api.dto;

import java.time.Instant;

public record BrowserEventResponse(
        Long id,
        String eventType,
        String url,
        String title,
        int tabId,
        Instant timestamp
) {
}
