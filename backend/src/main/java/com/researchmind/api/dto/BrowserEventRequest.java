package com.researchmind.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BrowserEventRequest(
        @NotBlank String eventType,
        String url,
        String title,
        @NotNull Integer tabId,
        Integer windowId,
        String transitionType,
        String referrerUrl,
        @NotNull Long timestamp,
        String sessionId
) {
}
