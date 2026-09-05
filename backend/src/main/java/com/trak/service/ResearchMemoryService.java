package com.trak.service;

import com.trak.api.dto.ResearchMemoryResponse;
import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.ResearchSession;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.BrowserEventRepository;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.ResearchSessionRepository;
import com.trak.domain.repository.SearchQueryRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResearchMemoryService {

    private final ResearchSessionRepository sessionRepository;
    private final BrowserEventRepository eventRepository;
    private final PageVisitRepository pageVisitRepository;
    private final SearchQueryRepository searchQueryRepository;

    public ResearchMemoryService(ResearchSessionRepository sessionRepository,
                                  BrowserEventRepository eventRepository,
                                  PageVisitRepository pageVisitRepository,
                                  SearchQueryRepository searchQueryRepository) {
        this.sessionRepository = sessionRepository;
        this.eventRepository = eventRepository;
        this.pageVisitRepository = pageVisitRepository;
        this.searchQueryRepository = searchQueryRepository;
    }

    @Transactional(readOnly = true)
    public ResearchMemoryResponse getMemory(String sessionId) {
        ResearchSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new com.trak.exception.ResourceNotFoundException("Session not found"));

        // --- SESSION ---
        long durationMs = computeDurationMs(session);
        Instant durationInstant = durationMs > 0 ? Instant.ofEpochMilli(durationMs) : null;

        // --- ACTIVITY (chronological combination of events and searches) ---
        List<ResearchMemoryResponse.ActivityEntry> activity = buildActivityEntries(sessionId);

        // --- SEARCHES ---
        List<ResearchMemoryResponse.SearchEntry> searches = buildSearchEntries(sessionId);

        // --- PAGES ---
        List<ResearchMemoryResponse.PageEntry> pages = buildPageEntries(sessionId);

        // --- DOMAINS ---
        List<ResearchMemoryResponse.DomainInfo> domains = buildDomainInfos(sessionId);

        // --- RELATIONSHIPS ---
        List<ResearchMemoryResponse.Relationship> relationships = buildRelationships(sessionId);

        // --- LAST KNOWN STATE ---
        ResearchMemoryResponse.LastKnownState lastKnownState = buildLastKnownState(sessionId);

        // --- SESSION SUMMARY ---
        ResearchMemoryResponse.SessionSummary summary = buildSummary(sessionId, durationMs, lastKnownState);

        // --- RESEARCH RESUME ---
        ResearchMemoryResponse.ResearchResume resume = buildResume(sessionId, lastKnownState);

        return new ResearchMemoryResponse(
                session.getId(),
                session.getTitle(),
                session.getStatus(),
                session.getStartTime(),
                session.getEndTime(),
                durationMs > 0 ? durationMs : null,
                activity,
                searches,
                pages,
                domains,
                relationships,
                lastKnownState,
                summary,
                resume
        );
    }

    private long computeDurationMs(ResearchSession session) {
        if (session.getEndTime() == null || session.getStartTime() == null) {
            return 0L;
        }
        return Duration.between(session.getStartTime(), session.getEndTime()).toMillis();
    }

    // Build chronological activity entries combining BrowserEvents and SearchQueries
    private List<ResearchMemoryResponse.ActivityEntry> buildActivityEntries(String sessionId) {
        List<BrowserEvent> events = eventRepository.findBySessionIdOrderByTimestamp(sessionId);
        List<SearchQuery> searches = searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId);

        List<ResearchMemoryResponse.ActivityEntry> entries = new ArrayList<>();

        // Add browser events
        for (BrowserEvent event : events) {
            String type = event.getEventType().name();
            entries.add(new ResearchMemoryResponse.ActivityEntry(
                    type,
                    event.getTimestamp(),
                    event.getUrl(),
                    event.getTitle(),
                    null,  // domain not directly stored on BrowserEvent
                    event.getTabId(),
                    event.getTransitionType(),
                    event.getReferrerUrl()
            ));
        }

        // Add searches
        for (SearchQuery search : searches) {
            entries.add(new ResearchMemoryResponse.ActivityEntry(
                    "SEARCH",
                    search.getTimestamp(),
                    search.getSourceUrl(),
                    search.getQueryText(),
                    null,
                    null,
                    null,
                    null
            ));
        }

        // Sort by timestamp
        entries.sort(Comparator.comparing(ResearchMemoryResponse.ActivityEntry::timestamp));
        return entries;
    }

    private List<ResearchMemoryResponse.SearchEntry> buildSearchEntries(String sessionId) {
        return searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId).stream()
                .map(q -> new ResearchMemoryResponse.SearchEntry(
                        q.getId(),
                        q.getQueryText(),
                        q.getEngine(),
                        q.getSourceUrl(),
                        q.getTimestamp()
                ))
                .collect(Collectors.toList());
    }

    private List<ResearchMemoryResponse.PageEntry> buildPageEntries(String sessionId) {
        return pageVisitRepository.findBySessionIdOrderByFirstVisited(sessionId).stream()
                .map(pv -> new ResearchMemoryResponse.PageEntry(
                        pv.getId(),
                        pv.getUrl(),
                        pv.getDomain(),
                        pv.getTitle(),
                        pv.getFirstVisited(),
                        pv.getLastVisited(),
                        pv.getVisitCount(),
                        pv.getDurationMs()
                ))
                .collect(Collectors.toList());
    }

    private List<ResearchMemoryResponse.DomainInfo> buildDomainInfos(String sessionId) {
        List<PageVisit> pages = pageVisitRepository.findBySessionId(sessionId);

        // Group by domain, collecting visit counts and first/last activity
        Map<String, Long> visitCounts = new LinkedHashMap<>();
        Map<String, Instant> firstActivities = new LinkedHashMap<>();
        Map<String, Instant> lastActivities = new LinkedHashMap<>();

        for (PageVisit pv : pages) {
            String domain = pv.getDomain();
            if (domain == null || domain.isBlank()) continue;

            visitCounts.merge(domain, 1L, Long::sum);

            firstActivities.putIfAbsent(domain, pv.getFirstVisited());
            lastActivities.put(domain, pv.getLastVisited());
        }

        // Compute earliest first activity per domain
        for (Map.Entry<String, Instant> entry : firstActivities.entrySet()) {
            String domain = entry.getKey();
            Instant first = entry.getValue();
            for (PageVisit pv : pages) {
                if (pv.getDomain().equals(domain) && pv.getFirstVisited().isBefore(first)) {
                    firstActivities.put(domain, pv.getFirstVisited());
                }
            }
        }

        // Compute latest last activity per domain (already done above since we iterate last-to-first)
        // Actually lastActivities already has the last visited due to the loop order

        return visitCounts.keySet().stream()
                .sorted()
                .map(domain -> new ResearchMemoryResponse.DomainInfo(
                        domain,
                        visitCounts.get(domain),
                        firstActivities.get(domain),
                        lastActivities.get(domain)
                ))
                .collect(Collectors.toList());
    }

    private List<ResearchMemoryResponse.Relationship> buildRelationships(String sessionId) {
        List<ResearchMemoryResponse.Relationship> relationships = new ArrayList<>();

        // search → page RESULTS_IN when page visited after search within 10 minutes (600 seconds)
        List<SearchQuery> searches = searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId);
        List<PageVisit> pages = pageVisitRepository.findBySessionIdOrderByFirstVisited(sessionId);

        for (SearchQuery sq : searches) {
            for (PageVisit pv : pages) {
                if (pv.getFirstVisited().isAfter(sq.getTimestamp()) &&
                        pv.getFirstVisited().isBefore(sq.getTimestamp().plusSeconds(600))) {
                    relationships.add(new ResearchMemoryResponse.Relationship(
                            sq.getId(),
                            pv.getId(),
                            "RESULTS_IN",
                            "Page visited after search query"
                    ));
                }
            }
        }

        // page → domain BELONGS_TO
        for (PageVisit pv : pages) {
            if (pv.getDomain() != null && !pv.getDomain().isBlank()) {
                relationships.add(new ResearchMemoryResponse.Relationship(
                        pv.getId(),
                        "domain:" + pv.getDomain(),
                        "BELONGS_TO",
                        "Page belongs to domain"
                ));
            }
        }

        // same-tab navigation relationships
        List<BrowserEvent> events = eventRepository.findBySessionIdOrderByTimestamp(sessionId);
        Map<Integer, List<BrowserEvent>> eventsByTab = events.stream()
                .collect(Collectors.groupingBy(BrowserEvent::getTabId));

        for (Map.Entry<Integer, List<BrowserEvent>> entry : eventsByTab.entrySet()) {
            List<BrowserEvent> tabEvents = entry.getValue();
            for (int i = 1; i < tabEvents.size(); i++) {
                BrowserEvent prev = tabEvents.get(i - 1);
                BrowserEvent curr = tabEvents.get(i);
                if (prev.getEventType() == com.trak.domain.model.EventType.NAVIGATION &&
                        curr.getEventType() == com.trak.domain.model.EventType.NAVIGATION) {
                    relationships.add(new ResearchMemoryResponse.Relationship(
                            String.valueOf(prev.getId()),
                            String.valueOf(curr.getId()),
                            "NAVIGATED_FROM",
                            "Same-tab navigation from event " + prev.getEventType().name()
                    ));
                }
            }
        }

        return relationships;
    }

    private ResearchMemoryResponse.LastKnownState buildLastKnownState(String sessionId) {
        List<BrowserEvent> events = eventRepository.findBySessionIdOrderByTimestamp(sessionId);
        List<SearchQuery> searches = searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId);
        List<PageVisit> pages = pageVisitRepository.findBySessionId(sessionId);

        // Find the latest entry by timestamp across all types
        Instant latestTimestamp = Instant.EPOCH;
        String latestType = null;
        String latestTitle = null;
        String latestUrl = null;
        String latestDomain = null;

        for (BrowserEvent event : events) {
            if (event.getTimestamp().isAfter(latestTimestamp)) {
                latestTimestamp = event.getTimestamp();
                latestType = event.getEventType().name();
                latestTitle = event.getTitle();
                latestUrl = event.getUrl();
                // Try to get domain from page visit if pageVisitId is set
                latestDomain = null; // BrowserEvent doesn't have domain
            }
        }

        for (SearchQuery search : searches) {
            if (search.getTimestamp().isAfter(latestTimestamp)) {
                latestTimestamp = search.getTimestamp();
                latestType = "SEARCH";
                latestTitle = search.getQueryText();
                latestUrl = search.getSourceUrl();
                latestDomain = null;
            }
        }

        for (PageVisit pv : pages) {
            if (pv.getLastVisited().isAfter(latestTimestamp)) {
                latestTimestamp = pv.getLastVisited();
                latestType = "PAGE_VISIT";
                latestTitle = pv.getTitle();
                latestUrl = pv.getUrl();
                latestDomain = pv.getDomain();
            }
        }

        if (latestType == null) {
            // No data at all - return a minimal state
            return new ResearchMemoryResponse.LastKnownState(
                    null, null, null, null, Instant.EPOCH
            );
        }

        return new ResearchMemoryResponse.LastKnownState(
                latestType,
                latestTitle,
                latestUrl,
                latestDomain,
                latestTimestamp
        );
    }

    private ResearchMemoryResponse.SessionSummary buildSummary(String sessionId, long durationMs, ResearchMemoryResponse.LastKnownState lastKnownState) {
        List<BrowserEvent> events = eventRepository.findBySessionIdOrderByTimestamp(sessionId);
        List<SearchQuery> searches = searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId);
        List<PageVisit> pages = pageVisitRepository.findBySessionId(sessionId);

        long totalEvents = events.size();
        long totalPageVisits = pages.size();
        long uniquePages = pages.stream().map(PageVisit::getId).distinct().count();
        long totalSearches = searches.size();

        // Unique searches - count distinct query texts
        long uniqueSearches = searches.stream()
                .map(SearchQuery::getQueryText)
                .distinct()
                .count();

        // Unique domains from page visits
        long uniqueDomains = pages.stream()
                .map(PageVisit::getDomain)
                .filter(d -> d != null && !d.isBlank())
                .distinct()
                .count();

        // First activity - earliest timestamp
        Instant firstActivity = Instant.EPOCH;
        List<BrowserEvent> allEvents = eventRepository.findBySessionIdOrderByTimestamp(sessionId);
        if (!allEvents.isEmpty()) {
            firstActivity = allEvents.get(0).getTimestamp();
        }
        // Also check searches
        List<SearchQuery> allSearches = searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId);
        if (!allSearches.isEmpty() && allSearches.get(0).getTimestamp().isBefore(firstActivity)) {
            firstActivity = allSearches.get(0).getTimestamp();
        }
        // Also check pages
        List<PageVisit> allPages = pageVisitRepository.findBySessionIdOrderByFirstVisited(sessionId);
        if (!allPages.isEmpty() && allPages.get(0).getFirstVisited().isBefore(firstActivity)) {
            firstActivity = allPages.get(0).getFirstVisited();
        }

        // Last activity - latest timestamp (from lastKnownState)
        Instant lastActivity = (lastKnownState != null && lastKnownState.timestamp() != null)
                ? lastKnownState.timestamp() : Instant.EPOCH;

        return new ResearchMemoryResponse.SessionSummary(
                totalEvents,
                totalPageVisits,
                uniquePages,
                totalSearches,
                uniqueSearches,
                uniqueDomains,
                durationMs > 0 ? durationMs : null,
                firstActivity,
                lastActivity
        );
    }

    private ResearchMemoryResponse.ResearchResume buildResume(String sessionId, ResearchMemoryResponse.LastKnownState lastKnownState) {
        List<PageVisit> pages = pageVisitRepository.findBySessionId(sessionId);
        List<SearchQuery> searches = searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId);
        List<BrowserEvent> events = eventRepository.findBySessionIdOrderByTimestamp(sessionId);

        String lastVisitedPageTitle = null;
        String lastVisitedPageUrl = null;
        String lastSearchQuery = null;
        String lastDomain = null;
        Instant lastTimestamp = Instant.EPOCH;
        String lastActivityType = null;

        // Last visited page (by lastVisited timestamp)
        if (!pages.isEmpty()) {
            PageVisit lastPv = pages.stream()
                    .max(Comparator.comparing(PageVisit::getLastVisited))
                    .orElse(null);
            if (lastPv != null) {
                lastVisitedPageTitle = lastPv.getTitle();
                lastVisitedPageUrl = lastPv.getUrl();
                lastDomain = lastPv.getDomain();
            }
        }

        // Last search
        if (!searches.isEmpty()) {
            lastSearchQuery = searches.get(searches.size() - 1).getQueryText();
        }

        // Last event/search/page by overall timestamp
        // We already have lastKnownState, use that
        if (lastKnownState != null && lastKnownState.timestamp() != null) {
            lastTimestamp = lastKnownState.timestamp();
            lastActivityType = lastKnownState.type();
        } else {
            // Fallback: find the latest across all types
            for (BrowserEvent event : events) {
                if (event.getTimestamp().isAfter(lastTimestamp)) {
                    lastTimestamp = event.getTimestamp();
                    lastActivityType = event.getEventType().name();
                }
            }
            for (SearchQuery search : searches) {
                if (search.getTimestamp().isAfter(lastTimestamp)) {
                    lastTimestamp = search.getTimestamp();
                    lastActivityType = "SEARCH";
                }
            }
            for (PageVisit pv : pages) {
                if (pv.getLastVisited().isAfter(lastTimestamp)) {
                    lastTimestamp = pv.getLastVisited();
                    lastActivityType = "PAGE_VISIT";
                }
            }
        }

        return new ResearchMemoryResponse.ResearchResume(
                lastVisitedPageTitle,
                lastVisitedPageUrl,
                lastSearchQuery,
                lastDomain,
                lastTimestamp,
                lastActivityType
        );
    }
}