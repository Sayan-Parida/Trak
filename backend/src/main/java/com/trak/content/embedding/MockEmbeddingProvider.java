package com.trak.content.embedding;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/**
 * Deterministic test/dev embedding provider. Used when no production
 * EmbeddingProvider bean is configured (tests, local isolated development).
 * MUST NOT be treated as production vector architecture.
 */
@Component
@ConditionalOnMissingBean(EmbeddingProvider.class)
public class MockEmbeddingProvider implements EmbeddingProvider {

    public static final int MOCK_DIMENSION = 8;

    @Override
    public String name() {
        return "mock";
    }

    @Override
    public String model() {
        return "mock-model";
    }

    @Override
    public int dimension() {
        return MOCK_DIMENSION;
    }

    @Override
    public EmbeddingResult embed(String text) {
        if (text == null || text.isBlank()) {
            return EmbeddingResult.failure(EmbeddingResult.EmbeddingStatus.INPUT_INVALID,
                    "EMPTY_INPUT", "blank text");
        }
        return EmbeddingResult.success(vectorFor(text));
    }

    @Override
    public List<EmbeddingResult> embedAll(List<String> texts) {
        List<EmbeddingResult> out = new ArrayList<>(texts.size());
        for (String t : texts) out.add(embed(t));
        return out;
    }

    /** Deterministic: same text -> same vector. */
    public static float[] vectorFor(String text) {
        float[] v = new float[MOCK_DIMENSION];
        int h = text.hashCode();
        for (int i = 0; i < MOCK_DIMENSION; i++) {
            int mixed = h * 31 + i * 0x9E3779B1;
            v[i] = ((mixed % 1000) / 1000.0f + 1.0f) / 2.0f + 0.01f * i;
        }
        return v;
    }
}
