package com.trak.processing;

import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Component
public class SearchDetector {

    public record SearchResult(String queryText, String engine) {}

    private static final Map<String, String> ENGINE_PARAM_MAP = Map.of(
        "google", "q",
        "bing", "q",
        "duckduckgo", "q",
        "youtube", "search_query",
        "github", "q",
        "stackoverflow", "q"
    );

    public Optional<SearchResult> detect(String urlString) {
        if (urlString == null || urlString.isBlank()) {
            return Optional.empty();
        }
        try {
            URI uri = new URI(urlString);
            String host = uri.getHost();
            if (host == null) return Optional.empty();

            host = host.toLowerCase();
            String engine = null;
            String param = null;

            if (isHostOrSubdomain(host, "google.com") && uri.getPath().startsWith("/search")) {
                engine = "Google";
                param = "q";
            } else if (isHostOrSubdomain(host, "bing.com") && uri.getPath().startsWith("/search")) {
                engine = "Bing";
                param = "q";
            } else if (isHostOrSubdomain(host, "duckduckgo.com")) {
                engine = "DuckDuckGo";
                param = "q";
            } else if (isHostOrSubdomain(host, "youtube.com") && uri.getPath().startsWith("/results")) {
                engine = "YouTube";
                param = "search_query";
            } else if (isHostOrSubdomain(host, "github.com") && uri.getPath().startsWith("/search")) {
                engine = "GitHub";
                param = "q";
            } else if (isHostOrSubdomain(host, "stackoverflow.com") && uri.getPath().startsWith("/search")) {
                engine = "StackOverflow";
                param = "q";
            }

            if (engine != null && param != null) {
                var queryParams = UriComponentsBuilder.fromUri(uri).build().getQueryParams();
                List<String> queryValues = queryParams.get(param);
                if (queryValues != null && !queryValues.isEmpty()) {
                    String queryText = queryValues.get(0);
                    if (queryText != null && !queryText.isBlank()) {
                        String decoded = java.net.URLDecoder.decode(queryText, java.nio.charset.StandardCharsets.UTF_8);
                        return Optional.of(new SearchResult(decoded, engine));
                    }
                }
            }
        } catch (Exception e) {
            // Invalid URL or URI syntax exception, ignore and return empty
        }
        return Optional.empty();
    }

    private boolean isHostOrSubdomain(String host, String registeredDomain) {
        return host.equals(registeredDomain) || host.endsWith("." + registeredDomain);
    }
}
