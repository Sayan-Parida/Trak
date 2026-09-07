package com.trak.api.dto;

import java.time.Instant;

public record ContentStatusResponse(
        String pageVisitId,
        String contentDocumentId,
        String contentVersionId,
        String status,
        int chunkCount,
        int embeddedCount,
        Instant lastExtractedAt
) {
}
