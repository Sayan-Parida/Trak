package com.trak.service;

import com.trak.api.dto.ResumePointResponse;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.ResearchSession;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.BrowserEventRepository;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.ResearchSessionRepository;
import com.trak.domain.repository.SearchQueryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResearchSessionServiceResumePointTest {

    private static final String SESSION_ID = "session-1";
    private static final Instant START = Instant.parse("2026-01-01T00:00:00Z");

    private ResearchSessionRepository sessionRepository;
    private PageVisitRepository pageVisitRepository;
    private SearchQueryRepository searchQueryRepository;
    private ResearchSessionService sessionService;

    @BeforeEach
    void setUp() {
        sessionRepository = mock(ResearchSessionRepository.class);
        BrowserEventRepository eventRepository = mock(BrowserEventRepository.class);
        pageVisitRepository = mock(PageVisitRepository.class);
        searchQueryRepository = mock(SearchQueryRepository.class);
        PageVisitService pageVisitService = mock(PageVisitService.class);
        ResearchSearchIndexService searchIndexService = mock(ResearchSearchIndexService.class);
        sessionService = new ResearchSessionService(sessionRepository, eventRepository, pageVisitRepository,
                searchQueryRepository, pageVisitService, searchIndexService);

        ResearchSession session = new ResearchSession();
        session.setId(SESSION_ID);
        session.setStartTime(START);
        when(sessionRepository.findById(SESSION_ID)).thenReturn(Optional.of(session));
    }

    @Test
    void picksMostRecentlyVisitedMeaningfulPage() {
        PageVisit earlier = page("pv-1", "https://example.com/a", "Page A", "2026-01-02T10:00:00Z");
        PageVisit latest = page("pv-2", "https://example.com/b", "Page B", "2026-01-02T11:00:00Z");
        stubActiveSessionPages(earlier, latest);

        ResumePointResponse response = sessionService.getResumePoint(SESSION_ID);

        assertNotNull(response.page());
        assertEquals("pv-2", response.page().id());
        assertEquals("https://example.com/b", response.page().url());
        assertEquals("Page B", response.page().title());
    }

    @Test
    void skipsInternalAndBlankTitlePages() {
        PageVisit internal = page("pv-1", "chrome://newtab", "New Tab", "2026-01-02T11:05:00Z");
        PageVisit about = page("pv-2", "about:blank", "Blank", "2026-01-02T11:04:00Z");
        PageVisit blankTitle = page("pv-3", "https://example.com/untitled", "", "2026-01-02T11:03:00Z");
        PageVisit meaningful = page("pv-4", "https://example.com/paper", "Meaningful Research", "2026-01-02T10:00:00Z");
        stubActiveSessionPages(internal, about, blankTitle, meaningful);

        ResumePointResponse response = sessionService.getResumePoint(SESSION_ID);

        assertNotNull(response.page());
        assertEquals("pv-4", response.page().id());
    }

    @Test
    void associatesOnlySearchLinkedByPageVisitId() {
        PageVisit stopping = page("pv-1", "https://example.com/paper", "Paper", "2026-01-02T10:00:00Z");
        stubActiveSessionPages(stopping);
        SearchQuery linked = search("sq-1", "stopping query", "2026-01-02T10:01:00Z", "pv-1");
        SearchQuery unrelated = search("sq-2", "other query", "2026-01-02T09:00:00Z", "pv-other");
        when(searchQueryRepository.findBySessionId(SESSION_ID)).thenReturn(List.of(linked, unrelated));

        ResumePointResponse response = sessionService.getResumePoint(SESSION_ID);

        assertNotNull(response.search());
        assertEquals("sq-1", response.search().id());
        assertEquals("stopping query", response.search().queryText());
    }

    @Test
    void picksLatestSearchWhenSeveralShareTheStoppingPage() {
        PageVisit stopping = page("pv-1", "https://example.com/paper", "Paper", "2026-01-02T10:00:00Z");
        stubActiveSessionPages(stopping);
        SearchQuery earlier = search("sq-1", "first query", "2026-01-02T09:00:00Z", "pv-1");
        SearchQuery later = search("sq-2", "second query", "2026-01-02T10:30:00Z", "pv-1");
        when(searchQueryRepository.findBySessionId(SESSION_ID)).thenReturn(List.of(earlier, later));

        ResumePointResponse response = sessionService.getResumePoint(SESSION_ID);

        assertNotNull(response.search());
        assertEquals("sq-2", response.search().id());
        assertEquals("second query", response.search().queryText());
    }

    @Test
    void returnsNullPageWhenNoMeaningfulPage() {
        PageVisit internal = page("pv-1", "chrome://newtab", "New Tab", "2026-01-02T11:05:00Z");
        PageVisit blankTitle = page("pv-2", "https://example.com/untitled", " ", "2026-01-02T11:03:00Z");
        stubActiveSessionPages(internal, blankTitle);

        ResumePointResponse response = sessionService.getResumePoint(SESSION_ID);

        assertNull(response.page());
        assertNull(response.search());
    }

    @Test
    void scopesStoppingPointToCompletedSessionWindow() {
        ResearchSession completed = new ResearchSession();
        completed.setId(SESSION_ID);
        completed.setStartTime(START);
        completed.setEndTime(START.plusSeconds(3600));
        completed.setStatus("COMPLETED");
        when(sessionRepository.findById(SESSION_ID)).thenReturn(Optional.of(completed));

        PageVisit inWindow = page("pv-1", "https://example.com/paper", "Paper", "2026-01-01T00:30:00Z");
        when(pageVisitRepository.findBySessionIdAndFirstVisitedBetweenOrderByFirstVisited(
                SESSION_ID, START, completed.getEndTime())).thenReturn(List.of(inWindow));

        ResumePointResponse response = sessionService.getResumePoint(SESSION_ID);

        assertNotNull(response.page());
        assertEquals("pv-1", response.page().id());
    }

    private void stubActiveSessionPages(PageVisit... pages) {
        when(pageVisitRepository.findBySessionIdAndFirstVisitedGreaterThanEqualOrderByFirstVisited(
                SESSION_ID, START)).thenReturn(List.of(pages));
    }

    private PageVisit page(String id, String url, String title, String lastVisited) {
        PageVisit page = new PageVisit();
        page.setId(id);
        page.setUrl(url);
        page.setTitle(title);
        page.setFirstVisited(Instant.parse(lastVisited));
        page.setLastVisited(Instant.parse(lastVisited));
        page.setVisitCount(1);
        page.setSessionId(SESSION_ID);
        return page;
    }

    private SearchQuery search(String id, String queryText, String timestamp, String pageVisitId) {
        SearchQuery query = new SearchQuery();
        query.setId(id);
        query.setQueryText(queryText);
        query.setTimestamp(Instant.parse(timestamp));
        query.setPageVisitId(pageVisitId);
        query.setSessionId(SESSION_ID);
        return query;
    }
}