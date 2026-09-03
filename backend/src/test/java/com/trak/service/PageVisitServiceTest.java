package com.trak.service;

import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.EventType;
import com.trak.domain.model.PageVisit;
import com.trak.domain.repository.BrowserEventRepository;
import com.trak.domain.repository.PageVisitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PageVisitServiceTest {
    private static final String SESSION_ID = "session-1";
    private static final Instant START = Instant.parse("2026-01-01T00:00:00Z");

    private PageVisitRepository pageVisitRepository;
    private BrowserEventRepository browserEventRepository;
    private PageVisitService pageVisitService;

    @BeforeEach
    void setUp() {
        pageVisitRepository = mock(PageVisitRepository.class);
        browserEventRepository = mock(BrowserEventRepository.class);
        pageVisitService = new PageVisitService(pageVisitRepository, browserEventRepository);
    }

    @Test
    void attributesDurationToTabThatLosesFocus() {
        PageVisit tabA = page("https://a.example", "A");
        PageVisit tabB = page("https://b.example", "B");
        stubPages(tabA, tabB);

        estimate(activated(1, "https://a.example", 0), activated(2, "https://b.example", 5));

        assertEquals(5000, tabA.getDurationMs());
        assertEquals(0, tabB.getDurationMs());
    }

    @Test
    void attributesDurationToTabThatLosesFocusWhenSwitchingBack() {
        PageVisit tabA = page("https://a.example", "A");
        PageVisit tabB = page("https://b.example", "B");
        stubPages(tabA, tabB);

        estimate(activated(2, "https://b.example", 0), activated(1, "https://a.example", 7));

        assertEquals(7000, tabB.getDurationMs());
        assertEquals(0, tabA.getDurationMs());
    }

    @Test
    void navigationInInactiveTabDoesNotCorruptActiveTabTiming() {
        PageVisit tabA = page("https://a.example", "A");
        PageVisit tabB = page("https://b.example", "B");
        stubPages(tabA, tabB);

        estimate(activated(1, "https://a.example", 0), activated(2, "https://b.example", 5),
                navigated(1, "https://a.example/next", 10), activated(2, "https://b.example", 15));

        assertEquals(10000, tabB.getDurationMs());
        assertEquals(5000, tabA.getDurationMs());
    }

    @Test
    void tabClosedWithoutUrlFinalizesItsTrackedPage() {
        PageVisit tabB = page("https://b.example", "B");
        stubPages(tabB);

        estimate(activated(2, "https://b.example", 0), closed(2, 8));

        assertEquals(8000, tabB.getDurationMs());
    }

    @Test
    void closingInactiveTabDoesNotDoubleCountFinalizedDuration() {
        PageVisit tabA = page("https://a.example", "A");
        PageVisit tabB = page("https://b.example", "B");
        stubPages(tabA, tabB);

        estimate(activated(1, "https://a.example", 0), activated(2, "https://b.example", 5),
                closed(1, 8));

        assertEquals(5000, tabA.getDurationMs());
        assertEquals(0, tabB.getDurationMs());
    }

    @Test
    void singleTabNavigationStillRecordsDuration() {
        PageVisit tabA = page("https://a.example", "A");
        PageVisit nextPage = page("https://a.example/next", "Next");
        stubPages(tabA, nextPage);

        estimate(activated(1, "https://a.example", 0), navigated(1, "https://a.example/next", 6));

        assertEquals(6000, tabA.getDurationMs());
        assertEquals(0, nextPage.getDurationMs());
    }

    @Test
    void repeatedSingleTabActivationStillFinalizesPreviousInterval() {
        PageVisit tabA = page("https://a.example", "A");
        stubPages(tabA);

        estimate(activated(1, "https://a.example", 0), activated(1, "https://a.example", 4));

        assertEquals(4000, tabA.getDurationMs());
    }

    @Test
    void sessionEndFinalizesActiveTabDuration() {
        PageVisit tabA = page("https://a.example", "A");
        stubPages(tabA);

        estimateAtEnd(START.plusSeconds(9), activated(1, "https://a.example", 0));

        assertEquals(9000, tabA.getDurationMs());
    }

    @Test
    void sessionEndFinalizesOnlyTheActiveTabAfterMultipleTabs() {
        PageVisit tabA = page("https://a.example", "A");
        PageVisit tabB = page("https://b.example", "B");
        stubPages(tabA, tabB);

        estimateAtEnd(START.plusSeconds(9), activated(1, "https://a.example", 0),
                activated(2, "https://b.example", 5));

        assertEquals(5000, tabA.getDurationMs());
        assertEquals(4000, tabB.getDurationMs());
    }

    @Test
    void sessionEndDoesNotDoubleCountPageFinalizedByNavigation() {
        PageVisit tabA = page("https://a.example", "A");
        PageVisit nextPage = page("https://a.example/next", "Next");
        stubPages(tabA, nextPage);

        estimateAtEnd(START.plusSeconds(9), activated(1, "https://a.example", 0),
                navigated(1, "https://a.example/next", 5));

        assertEquals(5000, tabA.getDurationMs());
        assertEquals(4000, nextPage.getDurationMs());
    }

    private void estimate(BrowserEvent... events) {
        when(browserEventRepository.findBySessionIdOrderByTimestamp(SESSION_ID)).thenReturn(List.of(events));
        pageVisitService.estimateDuration(SESSION_ID);
    }

    private void estimateAtEnd(Instant endTime, BrowserEvent... events) {
        when(browserEventRepository.findBySessionIdOrderByTimestamp(SESSION_ID)).thenReturn(List.of(events));
        pageVisitService.estimateDuration(SESSION_ID, endTime);
    }

    private void stubPages(PageVisit... pages) {
        for (PageVisit page : pages) {
            when(pageVisitRepository.findByUrlAndSessionId(page.getUrl(), SESSION_ID))
                    .thenReturn(Optional.of(page));
        }
    }

    private PageVisit page(String url, String title) {
        PageVisit page = new PageVisit();
        page.setUrl(url);
        page.setTitle(title);
        page.setSessionId(SESSION_ID);
        page.setDurationMs(0);
        return page;
    }

    private BrowserEvent activated(int tabId, String url, long seconds) {
        return event(EventType.TAB_ACTIVATED, tabId, url, seconds);
    }

    private BrowserEvent navigated(int tabId, String url, long seconds) {
        return event(EventType.NAVIGATION, tabId, url, seconds);
    }

    private BrowserEvent closed(int tabId, long seconds) {
        return event(EventType.TAB_CLOSED, tabId, null, seconds);
    }

    private BrowserEvent event(EventType type, int tabId, String url, long seconds) {
        BrowserEvent event = new BrowserEvent();
        event.setEventType(type);
        event.setTabId(tabId);
        event.setUrl(url);
        event.setSessionId(SESSION_ID);
        event.setTimestamp(START.plusSeconds(seconds));
        return event;
    }
}