package com.trak.content.embedding;

import java.util.List;

/**
 * Explicit embedding outcome. Production code MUST NOT use null vectors as
 * failure signals; CONTENT_EXTRACTED but EMBEDDING_FAILED is representable.
 */
public record EmbeddingResult(
        boolean success,
        float[] vector,
        EmbeddingStatus status,
        String errorCode,
        String errorMessage
) {
    public enum EmbeddingStatus {
        SUCCESS,
        EMBEDDING_FAILED,
        PROVIDER_UNAVAILABLE,
        INPUT_INVALID,
        RATE_LIMITED,
        TIMEOUT
    }

    public static EmbeddingResult success(float[] vector) {
        return new EmbeddingResult(true, vector, EmbeddingStatus.SUCCESS, null, null);
    }

    public static EmbeddingResult failure(EmbeddingStatus status, String errorCode, String errorMessage) {
        return new EmbeddingResult(false, null, status, errorCode, errorMessage);
    }
}
