package com.trak.service;

import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.EventType;
import com.trak.domain.model.PageVisit;
import com.trak.domain.repository.BrowserEventRepository;
import com.trak.domain.repository.PageVisitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
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
            visit.setVisitCount(1);
            visit.setDurationMs(0);
            return pageVisitRepository.save(visit);
        }
    }

    @Transactional
    public void estimateDuration(String sessionId) {
        List<BrowserEvent> events = browserEventRepository.findBySessionIdOrderByTimestamp(sessionId);
        
        Instant currentActivationTime = null;
        String currentUrl = null;
        
        for (BrowserEvent event : events) {
            if (event.getEventType() == EventType.TAB_ACTIVATED || event.getEventType() == EventType.NAVIGATION) {
                if (currentActivationTime != null && currentUrl != null) {
                    addDuration(currentUrl, sessionId, Duration.between(currentActivationTime, event.getTimestamp()).toMillis());
                }
                currentActivationTime = event.getTimestamp();
                currentUrl = event.getUrl();
            } else if (event.getEventType() == EventType.TAB_CLOSED) {
                if (currentActivationTime != null && currentUrl != null && currentUrl.equals(event.getUrl())) {
                    addDuration(currentUrl, sessionId, Duration.between(currentActivationTime, event.getTimestamp()).toMillis());
                    currentActivationTime = null;
                    currentUrl = null;
                }
            }
        }
    }

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
