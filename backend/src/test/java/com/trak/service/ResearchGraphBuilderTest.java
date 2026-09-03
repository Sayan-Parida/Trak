package com.trak.service;

import com.trak.api.dto.ResearchGraphResponse;
import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.EventType;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.SearchQuery;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ResearchGraphBuilderTest {
    private static final String SESSION = "session-1";
    private final ResearchGraphBuilder builder = new ResearchGraphBuilder();
    private final Instant start = Instant.parse("2026-01-01T00:00:00Z");

    @Test
    void createsSearchToPageRelationship() {
        ResearchGraphResponse graph = build(List.of(event("search-page", 60, 1, "search-page", EventType.NAVIGATION),
                        event("result-page", 120, 1, "result-page", EventType.NAVIGATION)),
                List.of(page("search-page", 60, "Search"), page("result-page", 120, "Oracle")),
                List.of(search("search-1", 60, "search-page", "java virtual threads")));

        ResearchGraphResponse.ResearchGraphEdge edge = graph.edges().stream()
            .filter(candidate -> candidate.source().equals("search:search-1")
                && candidate.target().equals("page:result-page")
                && candidate.relationshipType().equals("SEARCH_TO_PAGE"))
            .findFirst().orElseThrow();
        assertEquals("Page opened after a search in the same tab", edge.reason());
        assertEquals(0.9, edge.confidence());
    }

    @Test
    void connectsMultiplePagesAndSubsequentSearchesInSameTab() {
        ResearchGraphResponse graph = build(List.of(event("s1-page", 60, 1, "s1-page", EventType.NAVIGATION),
                        event("p1", 120, 1, "p1", EventType.NAVIGATION), event("p2", 180, 1, "p2", EventType.NAVIGATION),
                        event("s2-page", 240, 1, "s2-page", EventType.NAVIGATION)),
                List.of(page("s1-page", 60, "Search"), page("p1", 120, "One"), page("p2", 180, "Two"), page("s2-page", 240, "Search 2")),
                List.of(search("s1", 60, "s1-page", "kafka"), search("s2", 240, "s2-page", "kafka performance")));

        assertTrue(hasEdge(graph, "search:s1", "page:p1", "SEARCH_TO_PAGE"));
        assertTrue(hasEdge(graph, "search:s1", "page:p2", "SEARCH_TO_PAGE"));
        assertTrue(hasEdge(graph, "search:s1", "search:s2", "SEARCH_TO_SEARCH"));
        assertTrue(hasEdge(graph, "page:p1", "page:p2", "PAGE_TO_PAGE"));
        assertTrue(hasEdge(graph, "page:p2", "search:s2", "PAGE_TO_SEARCH"));
    }

    @Test
    void supportsTwoResearchBranchesWithoutCrossTabEdges() {
        ResearchGraphResponse graph = build(List.of(
                        event("kafka-search", 60, 1, "kafka-search", EventType.NAVIGATION),
                        event("performance", 120, 1, "performance", EventType.NAVIGATION),
                        event("architecture-search", 60, 2, "architecture-search", EventType.NAVIGATION),
                        event("consumers", 120, 2, "consumers", EventType.NAVIGATION)),
                List.of(page("kafka-search", 60, "Kafka"), page("performance", 120, "Performance benchmarks"),
                        page("architecture-search", 60, "Kafka architecture"), page("consumers", 120, "Consumer groups")),
                List.of(search("performance-search", 60, "kafka-search", "Kafka performance"),
                        search("architecture-search", 60, "architecture-search", "Kafka architecture")));

        assertTrue(hasEdge(graph, "search:performance-search", "page:performance", "SEARCH_TO_PAGE"));
        assertTrue(hasEdge(graph, "search:architecture-search", "page:consumers", "SEARCH_TO_PAGE"));
        assertFalse(hasEdge(graph, "search:performance-search", "page:consumers", "SEARCH_TO_PAGE"));
    }

    @Test
    void doesNotConnectDifferentTabsOrSessions() {
        BrowserEvent otherSessionEvent = event("other-session", 180, 1, "other-session", EventType.NAVIGATION);
        otherSessionEvent.setSessionId("other-session");
        PageVisit otherSessionPage = page("other-session", 180, "Else");
        otherSessionPage.setSessionId("other-session");
        ResearchGraphResponse graph = build(List.of(event("s-page", 60, 1, "s-page", EventType.NAVIGATION),
                event("other-tab", 120, 2, "other-tab", EventType.NAVIGATION), otherSessionEvent),
            List.of(page("s-page", 60, "Search"), page("other-tab", 120, "Other"), otherSessionPage),
            List.of(search("s1", 60, "s-page", "kafka")));

        assertFalse(hasEdge(graph, "search:s1", "page:other-tab", "SEARCH_RESULT"));
        assertFalse(graph.nodes().stream().anyMatch(node -> node.id().equals("page:other-session")));
    }

    @Test
    void duplicateInputProducesOneRelationshipAndIdenticalGraphsAreEqual() {
        BrowserEvent searchEvent = event("s-page", 60, 1, "s-page", EventType.NAVIGATION);
        BrowserEvent pageEvent = event("result", 120, 1, "result", EventType.NAVIGATION);
        List<BrowserEvent> events = List.of(searchEvent, pageEvent, pageEvent);
        List<PageVisit> pages = List.of(page("s-page", 60, "Search"), page("result", 120, "Result"));
        List<SearchQuery> searches = List.of(search("s1", 60, "s-page", "kafka"));

        ResearchGraphResponse first = build(events, pages, searches);
        ResearchGraphResponse second = build(events, pages, searches);
        assertEquals(first, second);
        assertEquals(1, first.edges().stream().filter(edge -> edge.relationshipType().equals("SEARCH_TO_PAGE")).count());
        assertEquals(1, first.nodes().stream().filter(node -> node.id().equals("page:result")).count());
    }

    @Test
    void repeatedPageVisitRemainsOneNodeWithVisitCount() {
        PageVisit repeated = page("result", 120, "Result");
        repeated.setVisitCount(3);
        ResearchGraphResponse graph = build(List.of(event("result", 120, 1, "result", EventType.NAVIGATION)),
                List.of(repeated, repeated), List.of());

        assertEquals(1, graph.nodes().stream().filter(node -> node.id().equals("page:result")).count());
        assertEquals(3, graph.nodes().stream().filter(node -> node.id().equals("page:result"))
                .findFirst().orElseThrow().metadata().get("visits"));
    }

            @Test
            void reusesOneDomainNodeForMultiplePages() {
            ResearchGraphResponse graph = build(List.of(event("one", 60, 1, "one", EventType.NAVIGATION),
                    event("two", 120, 1, "two", EventType.NAVIGATION)),
                List.of(page("one", 60, "One"), page("two", 120, "Two")), List.of());

            assertEquals(1, graph.nodes().stream().filter(node -> node.type().equals("DOMAIN")
                && node.id().equals("domain:example.com")).count());
            assertEquals(2, graph.edges().stream().filter(edge -> edge.relationshipType().equals("PAGE_TO_DOMAIN")).count());
            }

    @Test
    void ignoresEventsOutsideSessionBoundaries() {
        BrowserEvent before = event("before", 10, 1, "before", EventType.NAVIGATION);
        BrowserEvent inside = event("inside", 60, 1, "inside", EventType.NAVIGATION);
        BrowserEvent after = event("after", 120, 1, "after", EventType.NAVIGATION);
        ResearchGraphResponse graph = builder.build(SESSION, start.plusSeconds(60), start.plusSeconds(60),
                List.of(before, inside, after), List.of(page("before", 10, "Before"), page("inside", 60, "Inside"),
                        page("after", 120, "After")), List.of());

        assertTrue(graph.nodes().stream().anyMatch(node -> node.id().equals("page:inside")));
        assertFalse(graph.nodes().stream().anyMatch(node -> node.id().equals("page:before")));
        assertFalse(graph.nodes().stream().anyMatch(node -> node.id().equals("page:after")));
    }

    @Test
    void emptySessionProducesValidEmptyGraph() {
        ResearchGraphResponse graph = build(List.of(), List.of(), List.of());
        assertEquals("session:" + SESSION, graph.nodes().get(0).id());
        assertTrue(graph.edges().isEmpty());
    }

    private ResearchGraphResponse build(List<BrowserEvent> events, List<PageVisit> pages, List<SearchQuery> searches) {
        return builder.build(SESSION, events, pages, searches);
    }

    private BrowserEvent event(String id, long seconds, int tab, String pageId, EventType type) {
        BrowserEvent event = new BrowserEvent();
        event.setId(Long.parseLong(String.valueOf(Math.abs(id.hashCode()))));
        event.setSessionId(SESSION);
        event.setTimestamp(start.plusSeconds(seconds));
        event.setTabId(tab);
        event.setPageVisitId(pageId);
        event.setEventType(type);
        return event;
    }

    private PageVisit page(String id, long seconds, String title) {
        PageVisit page = new PageVisit();
        page.setId(id);
        page.setSessionId(SESSION);
        page.setFirstVisited(start.plusSeconds(seconds));
        page.setLastVisited(start.plusSeconds(seconds));
        page.setUrl("https://example.com/" + id);
        page.setTitle(title);
        page.setDomain("example.com");
        return page;
    }

    private SearchQuery search(String id, long seconds, String pageId, String text) {
        SearchQuery search = new SearchQuery();
        search.setId(id);
        search.setSessionId(SESSION);
        search.setPageVisitId(pageId);
        search.setTimestamp(start.plusSeconds(seconds));
        search.setQueryText(text);
        search.setEngine("Google");
        search.setSourceUrl("https://google.com/search?q=" + text);
        return search;
    }

    private boolean hasEdge(ResearchGraphResponse graph, String source, String target, String type) {
        return graph.edges().stream().anyMatch(edge -> edge.source().equals(source)
                && edge.target().equals(target) && edge.relationshipType().equals(type));
    }
}
