package com.trak.api.dto;

import java.time.Instant;

/**
 * Deterministic "where did I stop" answer for a research session.
 *
 * <p>{@code page} is the most recent meaningful PageVisit of the session
 * (research URL, non-blank title). Its id is the MindMap PAGE node id, so the
 * frontend can focus the page on the Research Map. {@code search} is the
 * SearchQuery authoritative-linked to that page via {@code pageVisitId} (the
 * same provenance used for RESULTS_IN edges), when one exists.
 *
 * @param sessionId the session identifier
 * @param page      the stopping page, or {@code null} when the session has no
 *                  meaningful stopping point yet
 * @param search    the associated search for that page, or {@code null}
 */
public record ResumePointResponse(
        String sessionId,
        ResumePage page,
        ResumeSearch search
) {
    public record ResumePage(
            String id,
            String url,
            String domain,
            String title,
            Instant lastVisited,
            int visitCount
    ) {}

    public record ResumeSearch(
            String id,
            String queryText,
            String engine,
            Instant timestamp
    ) {}
}