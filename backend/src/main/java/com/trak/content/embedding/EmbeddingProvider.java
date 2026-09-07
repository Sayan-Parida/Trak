package com.trak.content.embedding;

import java.util.ArrayList;
import java.util.List;

/**
 * Embedding abstraction. Swappable via configuration (provider, model,
 * dimensions) without changing retrieval/business logic. Never hardcode
 * API keys; never log them.
 */
public interface EmbeddingProvider {

    /** Provider identifier, e.g. "openai-compatible" or "mock". */
    String name();

    /** Model identifier, e.g. "text-embedding-3-small". */
    String model();

    /** Embedding dimension; -1 if unavailable/misconfigured. */
    int dimension();

    default boolean isAvailable() {
        return dimension() > 0;
    }

    /** Embed a single text with explicit failure semantics. */
    EmbeddingResult embed(String text);

    /** Batch embed; default repeats embed() — providers may override. */
    default List<EmbeddingResult> embedAll(List<String> texts) {
        List<EmbeddingResult> out = new ArrayList<>(texts.size());
        for (String t : texts) out.add(embed(t));
        return out;
    }
}
