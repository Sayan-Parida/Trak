package com.trak.service;

import com.trak.api.dto.ResearchGraphResponse;
import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.SearchQuery;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ResearchGraphBuilder {
    private static final Duration RELATIONSHIP_WINDOW = Duration.ofMinutes(10);

    public ResearchGraphResponse build(String sessionId, List<BrowserEvent> events,
                                       List<PageVisit> pages, List<SearchQuery> searches) {
        List<BrowserEvent> orderedEvents = events.stream()
                .filter(event -> sessionId.equals(event.getSessionId()))
                .sorted(Comparator.comparing(BrowserEvent::getTimestamp).thenComparing(event -> event.getId() == null ? 0 : event.getId()))
                .toList();
        List<PageVisit> orderedPages = pages.stream()
                .filter(page -> sessionId.equals(page.getSessionId()))
                .sorted(Comparator.comparing(PageVisit::getFirstVisited).thenComparing(PageVisit::getId))
                .toList();
        List<SearchQuery> orderedSearches = searches.stream()
                .filter(search -> sessionId.equals(search.getSessionId()))
                .sorted(Comparator.comparing(SearchQuery::getTimestamp).thenComparing(SearchQuery::getId))
                .toList();

        List<ResearchGraphResponse.ResearchGraphNode> nodes = new ArrayList<>();
        nodes.add(new ResearchGraphResponse.ResearchGraphNode(
                "session:" + sessionId, "SESSION", sessionId, Map.of("sessionId", sessionId)));
        Map<String, PageVisit> pagesById = orderedPages.stream().collect(Collectors.toMap(PageVisit::getId, Function.identity()));
        for (SearchQuery search : orderedSearches) {
            nodes.add(new ResearchGraphResponse.ResearchGraphNode("search:" + search.getId(), "SEARCH",
                    search.getQueryText(), Map.of("queryId", search.getId(), "engine", search.getEngine(), "timestamp", search.getTimestamp())));
        }
        for (PageVisit page : orderedPages) {
            nodes.add(new ResearchGraphResponse.ResearchGraphNode("page:" + page.getId(), "PAGE",
                    page.getTitle() == null || page.getTitle().isBlank() ? page.getUrl() : page.getTitle(),
                    Map.of("url", page.getUrl(), "domain", page.getDomain() == null ? "" : page.getDomain(),
                            "visits", page.getVisitCount(), "firstVisited", page.getFirstVisited())));
        }

        List<ResearchGraphResponse.ResearchGraphEdge> edges = new ArrayList<>();
        Set<String> edgeKeys = new HashSet<>();
        Map<String, BrowserEvent> eventByPageVisit = new HashMap<>();
        for (BrowserEvent event : orderedEvents) {
            if (event.getPageVisitId() != null) {
                eventByPageVisit.putIfAbsent(event.getPageVisitId(), event);
            }
        }
        Map<String, Integer> tabBySearch = new HashMap<>();
        for (SearchQuery search : orderedSearches) {
            BrowserEvent sourceEvent = eventByPageVisit.get(search.getPageVisitId());
            if (sourceEvent != null) tabBySearch.put(search.getId(), sourceEvent.getTabId());
            addEdge(edges, edgeKeys, "session:" + sessionId, "search:" + search.getId(), "CONTAINS", 1.0,
                    "Search occurred within this research session", null, search.getTimestamp(), Map.of());
        }
        for (PageVisit page : orderedPages) {
            BrowserEvent firstEvent = eventByPageVisit.get(page.getId());
            addEdge(edges, edgeKeys, "session:" + sessionId, "page:" + page.getId(), "CONTAINS", 1.0,
                    "Page was visited within this research session", null, page.getFirstVisited(), Map.of());
            if (firstEvent != null) {
                for (SearchQuery search : orderedSearches) {
                    Integer searchTab = tabBySearch.get(search.getId());
                    if (searchTab != null && searchTab == firstEvent.getTabId()
                            && isAfterWithin(search.getTimestamp(), page.getFirstVisited())) {
                        addEdge(edges, edgeKeys, "search:" + search.getId(), "page:" + page.getId(), "SEARCH_RESULT", 0.9,
                                "Page opened after a search in the same tab", search.getTimestamp(), page.getFirstVisited(),
                                Map.of("tabId", firstEvent.getTabId()));
                    }
                }
            }
        }
        Map<String, String> domainNodeIds = new TreeMap<>();
        for (PageVisit page : orderedPages) {
            if (page.getDomain() != null && !page.getDomain().isBlank()) {
                domainNodeIds.putIfAbsent(page.getDomain(), "domain:" + page.getDomain());
            }
        }
        for (Map.Entry<String, String> domain : domainNodeIds.entrySet()) {
            nodes.add(new ResearchGraphResponse.ResearchGraphNode(domain.getValue(), "DOMAIN", domain.getKey(),
                    Map.of("domain", domain.getKey())));
        }
        for (PageVisit page : orderedPages) {
            if (page.getDomain() != null && domainNodeIds.containsKey(page.getDomain())) {
                addEdge(edges, edgeKeys, "page:" + page.getId(), domainNodeIds.get(page.getDomain()), "BELONGS_TO_DOMAIN", 1.0,
                        "Page URL belongs to this domain", page.getFirstVisited(), page.getFirstVisited(), Map.of());
            }
        }
        for (int index = 0; index < orderedSearches.size(); index++) {
            SearchQuery current = orderedSearches.get(index);
            Integer currentTab = tabBySearch.get(current.getId());
            if (currentTab == null) continue;
            for (int nextIndex = index + 1; nextIndex < orderedSearches.size(); nextIndex++) {
                SearchQuery next = orderedSearches.get(nextIndex);
                if (next.getTimestamp().isAfter(current.getTimestamp().plus(RELATIONSHIP_WINDOW))) break;
                if (currentTab.equals(tabBySearch.get(next.getId()))) {
                    addEdge(edges, edgeKeys, "search:" + current.getId(), "search:" + next.getId(), "SUBSEQUENT_SEARCH", 0.8,
                            "Subsequent search in the same tab", current.getTimestamp(), next.getTimestamp(), Map.of("tabId", currentTab));
                    break;
                }
            }
        }
        for (SearchQuery search : orderedSearches) {
            Integer searchTab = tabBySearch.get(search.getId());
            if (searchTab == null) continue;
            BrowserEvent previousPage = null;
            for (BrowserEvent event : orderedEvents) {
                if (event.getTabId() == searchTab && event.getTimestamp().isBefore(search.getTimestamp())
                        && event.getPageVisitId() != null && pagesById.containsKey(event.getPageVisitId())
                        && !event.getPageVisitId().equals(search.getPageVisitId())) {
                    if (previousPage == null || event.getTimestamp().isAfter(previousPage.getTimestamp())) previousPage = event;
                }
            }
            if (previousPage != null && isAfterWithin(previousPage.getTimestamp(), search.getTimestamp())) {
                addEdge(edges, edgeKeys, "page:" + previousPage.getPageVisitId(), "search:" + search.getId(), "PAGE_TO_SEARCH", 0.75,
                        "Search followed a page visit in the same tab", previousPage.getTimestamp(), search.getTimestamp(), Map.of("tabId", searchTab));
            }
        }
        Map<Integer, BrowserEvent> previousByTab = new HashMap<>();
        for (BrowserEvent event : orderedEvents) {
            if (event.getPageVisitId() == null || !pagesById.containsKey(event.getPageVisitId())) continue;
            BrowserEvent previous = previousByTab.put(event.getTabId(), event);
            if (previous != null && previous.getPageVisitId() != null && !previous.getPageVisitId().equals(event.getPageVisitId())
                    && previous.getEventType().name().equals("NAVIGATION") && event.getEventType().name().equals("NAVIGATION")) {
                addEdge(edges, edgeKeys, "page:" + previous.getPageVisitId(), "page:" + event.getPageVisitId(), "SAME_TAB_NAVIGATION", 0.85,
                        "Consecutive navigation events in the same tab", previous.getTimestamp(), event.getTimestamp(), Map.of("tabId", event.getTabId()));
            }
        }
        return new ResearchGraphResponse(sessionId, nodes, edges);
    }

    private boolean isAfterWithin(Instant earlier, Instant later) {
        return later.isAfter(earlier) && !later.isAfter(earlier.plus(RELATIONSHIP_WINDOW));
    }

    private void addEdge(List<ResearchGraphResponse.ResearchGraphEdge> edges, Set<String> keys,
                         String source, String target, String type, double confidence, String reason,
                         Instant sourceTimestamp, Instant targetTimestamp, Map<String, Object> metadata) {
        String key = source + "|" + target + "|" + type;
        if (keys.add(key)) edges.add(new ResearchGraphResponse.ResearchGraphEdge(source, target, type, confidence,
                reason, sourceTimestamp, targetTimestamp, metadata));
    }
}
