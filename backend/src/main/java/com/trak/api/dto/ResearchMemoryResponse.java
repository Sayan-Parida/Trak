package com.trak.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public record ResearchMemoryResponse(
        String sessionId,
        String title,
        String status,
        Instant startTime,
        Instant endTime,
        Long duration,
        List<ActivityEntry> activity,
        List<SearchEntry> searches,
        List<PageEntry> pages,
        List<DomainInfo> domains,
        List<Relationship> relationships,
        LastKnownState lastKnownState,
        SessionSummary summary,
        ResearchResume resume
) {

    public record ActivityEntry(
            String type,
            Instant timestamp,
            String url,
            String title,
            String domain,
            Integer tabId,
            String transitionType,
            String referrerUrl
    ) {}

    public record SearchEntry(
            String id,
            String queryText,
            String engine,
            String sourceUrl,
            Instant timestamp
    ) {}

    public record PageEntry(
            String id,
            String url,
            String domain,
            String title,
            Instant firstVisited,
            Instant lastVisited,
            int visitCount,
            long durationMs
    ) {}

    public record DomainInfo(
            String domain,
            long visitCount,
            Instant firstActivity,
            Instant lastActivity
    ) {}

    public record Relationship(
            String source,
            String target,
            String relationship,
            String description
    ) {}

    public record LastKnownState(
            String type,
            String title,
            String url,
            String domain,
            Instant timestamp
    ) {}

    public record SessionSummary(
            long totalEvents,
            long totalPageVisits,
            long uniquePages,
            long totalSearches,
            long uniqueSearches,
            long uniqueDomains,
            Long duration,
            Instant firstActivity,
            Instant lastActivity
    ) {}

    public record ResearchResume(
            String lastVisitedPageTitle,
            String lastVisitedPageUrl,
            String lastSearchQuery,
            String lastDomain,
            Instant lastTimestamp,
            String lastActivityType
    ) {}
}