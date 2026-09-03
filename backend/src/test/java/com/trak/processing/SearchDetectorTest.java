package com.trak.processing;

import org.junit.jupiter.api.Test;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class SearchDetectorTest {

    private final SearchDetector detector = new SearchDetector();

    @Test
    void detectGoogleSearch() {
        Optional<SearchDetector.SearchResult> result = detector.detect("https://www.google.com/search?q=spring+boot+3");
        assertTrue(result.isPresent());
        assertEquals("spring boot 3", result.get().queryText());
        assertEquals("Google", result.get().engine());
    }

    @Test
    void detectBingSearch() {
        Optional<SearchDetector.SearchResult> result = detector.detect("https://www.bing.com/search?q=java+21+features");
        assertTrue(result.isPresent());
        assertEquals("java 21 features", result.get().queryText());
        assertEquals("Bing", result.get().engine());
    }

    @Test
    void detectDuckDuckGoSearch() {
        Optional<SearchDetector.SearchResult> result = detector.detect("https://duckduckgo.com/?q=sqlite+wal+mode");
        assertTrue(result.isPresent());
        assertEquals("sqlite wal mode", result.get().queryText());
        assertEquals("DuckDuckGo", result.get().engine());
    }

    @Test
    void detectYouTubeSearch() {
        Optional<SearchDetector.SearchResult> result = detector.detect("https://www.youtube.com/results?search_query=spring+boot+tutorial");
        assertTrue(result.isPresent());
        assertEquals("spring boot tutorial", result.get().queryText());
        assertEquals("YouTube", result.get().engine());
    }

    @Test
    void detectGitHubSearch() {
        Optional<SearchDetector.SearchResult> result = detector.detect("https://github.com/search?q=repo%3Aspring-projects%2Fspring-boot+test");
        assertTrue(result.isPresent());
        assertEquals("repo:spring-projects/spring-boot test", result.get().queryText());
        assertEquals("GitHub", result.get().engine());
    }

    @Test
    void detectStackOverflowSearch() {
        Optional<SearchDetector.SearchResult> result = detector.detect("https://stackoverflow.com/search?q=jpa+entity");
        assertTrue(result.isPresent());
        assertEquals("jpa entity", result.get().queryText());
        assertEquals("StackOverflow", result.get().engine());
    }

    @Test
    void detectNonSearchUrl() {
        Optional<SearchDetector.SearchResult> result = detector.detect("https://www.google.com/maps");
        assertFalse(result.isPresent());
    }

    @Test
    void detectMalformedUrl() {
        Optional<SearchDetector.SearchResult> result = detector.detect("not-a-url");
        assertFalse(result.isPresent());
    }
}
