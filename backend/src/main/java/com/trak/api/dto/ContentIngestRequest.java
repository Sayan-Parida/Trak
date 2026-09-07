package com.trak.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ContentIngestRequest(
        String pageVisitId,
        String sessionId,
        @NotBlank String url,
        String title,
        String html,
        String captureMethod,
        Long dwellTimeSeconds,
        Boolean isIncognito
) {
    public String effectiveCaptureMethod() {
        if (captureMethod == null || captureMethod.isBlank()) return "MANUAL";
        return captureMethod.trim().toUpperCase();
    }

    public boolean effectiveIsIncognito() {
        return Boolean.TRUE.equals(isIncognito);
    }
}
