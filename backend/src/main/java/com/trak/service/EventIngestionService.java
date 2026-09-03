package com.trak.service;

import com.trak.api.dto.BrowserEventRequest;
import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.EventType;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.BrowserEventRepository;
import com.trak.domain.repository.SearchQueryRepository;
import com.trak.exception.DuplicateEventException;
import com.trak.processing.SearchDetector;
import com.trak.processing.SessionDetector;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class EventIngestionService {

    private final BrowserEventRepository browserEventRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final PageVisitService pageVisitService;
    private final SearchDetector searchDetector;
    private final SessionDetector sessionDetector;

    public EventIngestionService(BrowserEventRepository browserEventRepository,
                                 SearchQueryRepository searchQueryRepository,
                                 PageVisitService pageVisitService,
                                 SearchDetector searchDetector,
                                 SessionDetector sessionDetector) {
        this.browserEventRepository = browserEventRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.pageVisitService = pageVisitService;
        this.searchDetector = searchDetector;
        this.sessionDetector = sessionDetector;
    }

    @Transactional
    public BrowserEvent ingestEvent(BrowserEventRequest request) {
        Instant timestamp = Instant.ofEpochMilli(request.timestamp());
        
        // Dedup check
        if (browserEventRepository.findByTabIdAndUrlAndTimestamp(request.tabId(), request.url(), timestamp).isPresent()) {
            throw new DuplicateEventException("Event already exists");
        }

        BrowserEvent event = new BrowserEvent();
        event.setEventType(EventType.valueOf(request.eventType()));
        event.setUrl(request.url());
        event.setTitle(request.title());
        event.setTabId(request.tabId());
        event.setWindowId(request.windowId());
        event.setTransitionType(request.transitionType());
        event.setReferrerUrl(request.referrerUrl());
        event.setTimestamp(timestamp);
        
        if (request.sessionId() != null && sessionDetector.isValidSession(request.sessionId())) {
            event.setSessionId(request.sessionId());
        }

        // Process search detection and page visit creation immediately for simplicity
        if (event.getSessionId() != null && event.getUrl() != null) {
            PageVisit visit = pageVisitService.createOrUpdatePageVisit(event.getUrl(), event.getTitle(), event.getSessionId(), timestamp);
            if (visit != null) {
                event.setPageVisitId(visit.getId());
            }

            searchDetector.detect(event.getUrl()).ifPresent(result -> {
                SearchQuery query = new SearchQuery();
                query.setQueryText(result.queryText());
                query.setEngine(result.engine());
                query.setSourceUrl(event.getUrl());
                query.setTimestamp(timestamp);
                query.setSessionId(event.getSessionId());
                if (visit != null) {
                    query.setPageVisitId(visit.getId());
                }
                searchQueryRepository.save(query);
            });
        }
        
        event.setProcessed(true);
        return browserEventRepository.save(event);
    }

    @Transactional
    public List<BrowserEvent> ingestBatch(List<BrowserEventRequest> requests) {
        List<BrowserEvent> saved = new ArrayList<>();
        for (BrowserEventRequest request : requests) {
            try {
                saved.add(ingestEvent(request));
            } catch (DuplicateEventException e) {
                // Ignore duplicates in batch
            }
        }
        return saved;
    }
}
