package com.trak.content.embedding;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * PRODUCTION embedding provider: OpenAI-compatible HTTP endpoint.
 * Configured via tkr.embedding.* (endpoint + api key from environment).
 * Supports batching, retries with backoff, timeouts, explicit failure states.
 * Never logs API keys. Never sends prohibited browser data (only chunk text).
 */
@Component
@ConditionalOnProperty(prefix = "tkr.embedding", name = "provider", havingValue = "openai-compatible", matchIfMissing = false)
public class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String endpoint;
    private final String apiKey;
    private final String model;
    private final int dimension;
    private final int batchSize;
    private final int timeoutSeconds;
    private final int maxRetries;

    public OpenAICompatibleEmbeddingProvider(
            @Value("${tkr.embedding.endpoint:}") String endpoint,
            @Value("${tkr.embedding.api-key:}") String apiKey,
            @Value("${tkr.embedding.model:text-embedding-3-small}") String model,
            @Value("${tkr.embedding.dimension:1536}") int dimension,
            @Value("${tkr.embedding.batch-size:32}") int batchSize,
            @Value("${tkr.embedding.timeout-seconds:30}") int timeoutSeconds,
            @Value("${tkr.embedding.max-retries:3}") int maxRetries,
            ObjectMapper objectMapper) {
        this.endpoint = endpoint != null ? endpoint.trim() : "";
        this.apiKey = apiKey != null ? apiKey : "";
        this.model = model;
        this.dimension = dimension;
        this.batchSize = Math.max(1, batchSize);
        this.timeoutSeconds = Math.max(5, timeoutSeconds);
        this.maxRetries = Math.max(0, maxRetries);
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public String name() {
        return "openai-compatible";
    }

    @Override
    public String model() {
        return model;
    }

    @Override
    public int dimension() {
        if (endpoint.isEmpty() || apiKey.isEmpty()) return -1;
        return dimension;
    }

    @Override
    public EmbeddingResult embed(String text) {
        List<EmbeddingResult> results = embedAll(List.of(text == null ? "" : text));
        return results.isEmpty()
                ? EmbeddingResult.failure(EmbeddingResult.EmbeddingStatus.EMBEDDING_FAILED, "EMPTY", "no result")
                : results.get(0);
    }

    @Override
    public List<EmbeddingResult> embedAll(List<String> texts) {
        List<EmbeddingResult> out = new ArrayList<>();
        if (!isAvailable()) {
            for (int i = 0; i < texts.size(); i++) {
                out.add(EmbeddingResult.failure(EmbeddingResult.EmbeddingStatus.PROVIDER_UNAVAILABLE,
                        "NOT_CONFIGURED", "embedding endpoint or api key not configured"));
            }
            return out;
        }
        for (int i = 0; i < texts.size(); i += batchSize) {
            List<String> batch = texts.subList(i, Math.min(texts.size(), i + batchSize));
            out.addAll(embedBatchWithRetries(batch));
        }
        return out;
    }

    private List<EmbeddingResult> embedBatchWithRetries(List<String> batch) {
        Exception lastError = null;
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return postBatch(batch);
            } catch (RateLimitException e) {
                lastError = e;
                sleepBackoff(attempt);
            } catch (TimeoutFailure e) {
                lastError = e;
                if (attempt == maxRetries) break;
                sleepBackoff(attempt);
            } catch (Exception e) {
                lastError = e;
                if (attempt == maxRetries) break;
                sleepBackoff(attempt);
            }
        }
        List<EmbeddingResult> failed = new ArrayList<>();
        String code = lastError instanceof RateLimitException ? "RATE_LIMIT"
                : lastError instanceof TimeoutFailure ? "TIMEOUT" : "PROVIDER_ERROR";
        EmbeddingResult.EmbeddingStatus status = lastError instanceof RateLimitException
                ? EmbeddingResult.EmbeddingStatus.RATE_LIMITED
                : lastError instanceof TimeoutFailure
                ? EmbeddingResult.EmbeddingStatus.TIMEOUT
                : EmbeddingResult.EmbeddingStatus.EMBEDDING_FAILED;
        for (int i = 0; i < batch.size(); i++) {
            failed.add(EmbeddingResult.failure(status, code,
                    lastError != null ? lastError.getClass().getSimpleName() : "unknown"));
        }
        return failed;
    }

    private List<EmbeddingResult> postBatch(List<String> batch) throws Exception {
        Map<String, Object> payload = Map.of("model", model, "input", batch);
        String body = objectMapper.writeValueAsString(payload);
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
        // API key added to header but NEVER logged.
        if (!apiKey.isEmpty()) builder.header("Authorization", "Bearer " + apiKey);
        HttpResponse<String> response;
        try {
            response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (java.net.http.HttpTimeoutException e) {
            throw new TimeoutFailure(e);
        }
        int code = response.statusCode();
        if (code == 429) throw new RateLimitException("rate limited");
        if (code < 200 || code >= 300) {
            throw new IllegalStateException("embedding HTTP " + code);
        }
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode data = root.get("data");
        if (data == null || !data.isArray() || data.size() != batch.size()) {
            throw new IllegalStateException("unexpected embedding response shape");
        }
        List<EmbeddingResult> out = new ArrayList<>();
        for (JsonNode item : data) {
            JsonNode emb = item.get("embedding");
            float[] vec = new float[emb.size()];
            for (int i = 0; i < emb.size(); i++) vec[i] = (float) emb.get(i).asDouble();
            out.add(EmbeddingResult.success(vec));
        }
        return out;
    }

    private void sleepBackoff(int attempt) {
        try {
            Thread.sleep(Math.min(5000L, 300L * (1L << attempt)));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static final class RateLimitException extends Exception {
        RateLimitException(String m) { super(m); }
    }

    private static final class TimeoutFailure extends Exception {
        TimeoutFailure(Throwable c) { super(c); }
    }
}
