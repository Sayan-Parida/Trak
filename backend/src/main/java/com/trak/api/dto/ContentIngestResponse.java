package com.trak.api.dto;

import java.time.Instant;

public record ContentIngestResponse(
        String contentDocumentId,
        String contentVersionId,
        Integer version,
        String status,
        String contentHash,
        int chunkCount,
        int embeddedCount,
        int embeddingFailedCount,
        Instant extractedAt,
        Long captureId,
        String message
) {
}
