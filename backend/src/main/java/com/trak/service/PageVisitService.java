package com.trak.service;

import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.EventType;
import com.trak.domain.model.PageVisit;
import com.trak.domain.repository.BrowserEventRepository;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.processing.text.ResearchTextNormalizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PageVisitService {

    private final PageVisitRepository pageVisitRepository;
    private final BrowserEventRepository browserEventRepository;

    public PageVisitService(PageVisitRepository pageVisitRepository, BrowserEventRepository browserEventRepository) {
        this.pageVisitRepository = pageVisitRepository;
        this.browserEventRepository = browserEventRepository;
    }

    @Transactional
    public PageVisit createOrUpdatePageVisit(String url, String title, String sessionId, Instant timestamp) {
        if (url == null || url.isBlank() || sessionId == null || sessionId.isBlank()) {
            return null;
        }

        Optional<PageVisit> existing = pageVisitRepository.findByUrlAndSessionId(url, sessionId);
        if (existing.isPresent()) {
            PageVisit visit = existing.get();
            visit.setVisitCount(visit.getVisitCount() + 1);
            if (timestamp.isAfter(visit.getLastVisited())) {
                visit.setLastVisited(timestamp);
            }
            if (title != null && !title.isBlank()) {
                visit.setTitle(title);
                visit.setNormalizedTitle(ResearchTextNormalizer.normalize(title));
            }
            if (visit.getNormalizedDomain() == null) {
                visit.setNormalizedDomain(ResearchTextNormalizer.normalize(visit.getDomain()));
            }
            return pageVisitRepository.save(visit);
        } else {
            PageVisit visit = new PageVisit();
            visit.setUrl(url);
            visit.setSessionId(sessionId);
            visit.setFirstVisited(timestamp);
            visit.setLastVisited(timestamp);
            visit.setTitle(title);
            visit.setDomain(extractDomain(url));
            visit.setNormalizedTitle(ResearchTextNormalizer.normalize(title));
            visit.setNormalizedDomain(ResearchTextNormalizer.normalize(visit.getDomain()));
            visit.setVisitCount(1);
            visit.setDurationMs(0);
            return pageVisitRepository.save(visit);
        }
    }

    @Transactional
    public void estimateDuration(String sessionId) {
        estimateDuration(sessionId, null);
    }

    @Transactional
    public void estimateDuration(String sessionId, Instant endTime) {
        List<BrowserEvent> events = browserEventRepository.findBySessionIdOrderByTimestamp(sessionId);

        Map<Integer, TabTiming> timingByTab = new HashMap<>();
        Integer activeTabId = null;

        for (BrowserEvent event : events) {
            if (event.getEventType() == EventType.TAB_ACTIVATED) {
                if (activeTabId != null) {
                    finalizeTab(activeTabId, event.getTimestamp(), sessionId, timingByTab);
                    timingByTab.remove(activeTabId);
                }
                activeTabId = event.getTabId();
                timingByTab.put(event.getTabId(), new TabTiming(event.getTimestamp(), event.getUrl()));
            } else if (event.getEventType() == EventType.NAVIGATION) {
                if (activeTabId != null && activeTabId == event.getTabId()) {
                    finalizeTab(event.getTabId(), event.getTimestamp(), sessionId, timingByTab);
                    timingByTab.put(event.getTabId(), new TabTiming(event.getTimestamp(), event.getUrl()));
                }
            } else if (event.getEventType() == EventType.TAB_CLOSED) {
                finalizeTab(event.getTabId(), event.getTimestamp(), sessionId, timingByTab);
                timingByTab.remove(event.getTabId());
                if (event.getTabId() == activeTabId) {
                    activeTabId = null;
                }
            }
        }

        if (endTime != null && activeTabId != null) {
            finalizeTab(activeTabId, endTime, sessionId, timingByTab);
        }
    }

    private void finalizeTab(int tabId, Instant timestamp, String sessionId, Map<Integer, TabTiming> timingByTab) {
        TabTiming timing = timingByTab.get(tabId);
        if (timing != null && timing.url() != null) {
            addDuration(timing.url(), sessionId, Duration.between(timing.startedAt(), timestamp).toMillis());
        }
    }

    private record TabTiming(Instant startedAt, String url) {}

    private void addDuration(String url, String sessionId, long ms) {
        if (ms <= 0) return;
        pageVisitRepository.findByUrlAndSessionId(url, sessionId).ifPresent(visit -> {
            visit.setDurationMs(visit.getDurationMs() + ms);
            pageVisitRepository.save(visit);
        });
    }

    private String extractDomain(String urlString) {
        if (urlString == null) return null;
        try {
            URI uri = new URI(urlString);
            return uri.getHost();
        } catch (Exception e) {
            return null;
        }
    }
}
