package com.trak.service;

import com.trak.api.dto.ResearchGraphResponse;
import com.trak.api.dto.ResearchSearchResponse;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.ResearchSessionRepository;
import com.trak.domain.repository.SearchQueryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

class ResearchSearchServiceTest {
    private final SearchQueryRepository searchRepository = mock(SearchQueryRepository.class);
    private final PageVisitRepository pageRepository = mock(PageVisitRepository.class);
    private final ResearchSessionRepository sessionRepository = mock(ResearchSessionRepository.class);
    private final ResearchGraphService graphService = mock(ResearchGraphService.class);
    private final ResearchSearchIndexService indexService = mock(ResearchSearchIndexService.class);
    private final ResearchSearchService service = new ResearchSearchService(searchRepository, pageRepository, sessionRepository, graphService, indexService);
    private final Instant time = Instant.parse("2026-01-01T00:00:00Z");

    @BeforeEach
    void setUp() {
        when(graphService.getGraph(anyString())).thenReturn(new ResearchGraphResponse("session-1", List.of(), List.of()));
    }

    @Test
    void normalizesQueryAndRetrievesExactSearch() {
        SearchQuery search = search("s1", "  Java   Virtual Threads ");
        when(indexService.search(anyString(), anyInt())).thenReturn(List.of(hit("SEARCH", "s1")));
        when(searchRepository.findById("s1")).thenReturn(java.util.Optional.of(search));

        ResearchSearchResponse response = service.search(" JAVA  virtual   threads ");

        assertEquals("java virtual threads", response.normalizedQuery());
        assertEquals(1, response.totalResults());
        assertEquals("SEARCH", response.results().get(0).type());
        assertEquals(List.of("java", "virtual", "threads"), response.results().get(0).matchedTerms());
    }

    @Test
    void matchesTechnicalTermsInPageTitles() {
        PageVisit page = page("p1", "JVM tuning for Kafka and Postgres", 1, 0);
        when(indexService.search(anyString(), anyInt())).thenReturn(List.of(hit("PAGE", "p1")));
        when(pageRepository.findById("p1")).thenReturn(java.util.Optional.of(page));

        ResearchSearchResponse response = service.search("Kafka Postgres JVM");

        assertEquals(1, response.totalResults());
        assertEquals("PAGE", response.results().get(0).type());
        assertEquals(List.of("jvm", "kafka", "postgres"), response.results().get(0).matchedTerms());
    }

    @Test
    void ranksMoreImportantPageAboveLessVisitedPage() {
        PageVisit important = page("important", "Spring Boot reference", 4, 300000);
        PageVisit ordinary = page("ordinary", "Spring Boot example", 1, 0);
        when(indexService.search(anyString(), anyInt())).thenReturn(List.of(hit("PAGE", "important"), hit("PAGE", "ordinary")));
        when(pageRepository.findById("important")).thenReturn(java.util.Optional.of(important));
        when(pageRepository.findById("ordinary")).thenReturn(java.util.Optional.of(ordinary));

        ResearchSearchResponse response = service.search("spring boot");

        assertEquals("page:important", response.results().get(0).id());
        assertTrue(response.results().get(0).importanceScore() > response.results().get(1).importanceScore());
        assertTrue(response.results().get(0).reasons().stream().anyMatch(reason -> reason.contains("Visited 4 times")));
    }

    @Test
    void preservesSessionAndGraphContext() {
        SearchQuery search = search("s1", "Kafka performance");
        ResearchGraphResponse graph = new ResearchGraphResponse("session-1", List.of(), List.of(
                new ResearchGraphResponse.ResearchGraphEdge("search:s1", "page:p1", "SEARCH_TO_PAGE", 0.9,
                        "same tab, opened shortly after search", time, time.plusSeconds(10), java.util.Map.of("tabId", 1))));
        when(graphService.getGraph("session-1")).thenReturn(graph);
        when(indexService.search(anyString(), anyInt())).thenReturn(List.of(hit("SEARCH", "s1")));
        when(searchRepository.findById("s1")).thenReturn(java.util.Optional.of(search));

        ResearchSearchResponse.ResearchResult result = service.search("kafka").results().get(0);

        assertEquals("session-1", result.sessionId());
        assertEquals(1, result.graphContext().size());
        assertEquals("SEARCH_TO_PAGE", result.graphContext().get(0).relationshipType());
    }

    @Test
    void buildsGraphContextOnceForMultipleResultsFromOneSession() {
        SearchQuery first = search("s1", "Kafka performance");
        SearchQuery second = search("s2", "Kafka architecture");
        when(indexService.search(anyString(), anyInt())).thenReturn(List.of(hit("SEARCH", "s1"), hit("SEARCH", "s2")));
        when(searchRepository.findById("s1")).thenReturn(java.util.Optional.of(first));
        when(searchRepository.findById("s2")).thenReturn(java.util.Optional.of(second));

        ResearchSearchResponse response = service.search("kafka");

        assertEquals(2, response.totalResults());
        verify(graphService, times(1)).getGraph("session-1");
    }

    @Test
    void recentEvidenceRanksAboveOlderEquivalentEvidence() {
        PageVisit oldPage = page("old", "Spring Boot reference", 1, 0);
        PageVisit recentPage = page("recent", "Spring Boot reference", 1, 0);
        recentPage.setFirstVisited(time.plusSeconds(30L * 24 * 3600));
        recentPage.setLastVisited(time.plusSeconds(30L * 24 * 3600));
        when(indexService.search(anyString(), anyInt())).thenReturn(List.of(hit("PAGE", "old"), hit("PAGE", "recent")));
        when(pageRepository.findById("old")).thenReturn(java.util.Optional.of(oldPage));
        when(pageRepository.findById("recent")).thenReturn(java.util.Optional.of(recentPage));

        ResearchSearchResponse response = service.search("spring boot");

        assertEquals("page:recent", response.results().get(0).id());
        assertTrue(response.results().get(0).reasons().contains("Recent research activity"));
    }

    @Test
    void deduplicatesCandidatesAndIsDeterministic() {
        PageVisit page = page("p1", "Kubernetes deployment", 2, 1000);
        when(indexService.search(anyString(), anyInt())).thenReturn(List.of(hit("PAGE", "p1"), hit("PAGE", "p1")));
        when(pageRepository.findById("p1")).thenReturn(java.util.Optional.of(page));

        ResearchSearchResponse first = service.search("kubernetes");
        ResearchSearchResponse second = service.search("KUBERNETES");

        assertEquals(first.results(), second.results());
        assertEquals(1, first.totalResults());
    }

    @Test
    void handlesEmptyAndUnknownQueries() {
        assertTrue(service.search("   ").results().isEmpty());
        assertTrue(service.search("unknown").results().isEmpty());
    }

    @Test
    void appliesBoundedLimitAndSessionFilter() {
        PageVisit first = page("p1", "Kafka performance", 1, 0);
        PageVisit second = page("p2", "Kafka architecture", 1, 0);
        second.setSessionId("session-2");
        when(indexService.search(anyString(), anyInt())).thenReturn(List.of(hit("PAGE", "p1"), hit("PAGE", "p2")));
        when(pageRepository.findById("p1")).thenReturn(java.util.Optional.of(first));
        when(pageRepository.findById("p2")).thenReturn(java.util.Optional.of(second));

        ResearchSearchResponse response = service.search("kafka", 1, "session-1", "PAGE", null);

        assertEquals(1, response.totalResults());
        assertEquals("page:p1", response.results().get(0).id());
    }

    private SearchQuery search(String id, String text) {
        SearchQuery search = new SearchQuery();
        search.setId(id);
        search.setSessionId("session-1");
        search.setQueryText(text);
        search.setNormalizedQuery(text.toLowerCase());
        search.setTimestamp(time);
        search.setEngine("Google");
        search.setSourceUrl("https://google.com/search");
        return search;
    }

    private ResearchSearchIndexService.IndexHit hit(String type, String id) {
        return new ResearchSearchIndexService.IndexHit(id, type, id, "session-1", time.toString(), null, null, -1.0);
    }

    private PageVisit page(String id, String title, int visits, long duration) {
        PageVisit page = new PageVisit();
        page.setId(id);
        page.setSessionId("session-1");
        page.setTitle(title);
        page.setNormalizedTitle(title.toLowerCase());
        page.setDomain("example.com");
        page.setUrl("https://example.com/" + id);
        page.setFirstVisited(time);
        page.setLastVisited(time);
        page.setVisitCount(visits);
        page.setDurationMs(duration);
        return page;
    }
}
