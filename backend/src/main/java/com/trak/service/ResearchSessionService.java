package com.trak.service;

import com.trak.api.dto.MindMapResponse;
import com.trak.api.dto.TimelineEntryResponse;
import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.ResearchSession;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.BrowserEventRepository;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.ResearchSessionRepository;
import com.trak.domain.repository.SearchQueryRepository;
import com.trak.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResearchSessionService {

    private final ResearchSessionRepository sessionRepository;
    private final BrowserEventRepository eventRepository;
    private final PageVisitRepository pageVisitRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final PageVisitService pageVisitService;

    public ResearchSessionService(ResearchSessionRepository sessionRepository,
                                  BrowserEventRepository eventRepository,
                                  PageVisitRepository pageVisitRepository,
                                  SearchQueryRepository searchQueryRepository,
                                  PageVisitService pageVisitService) {
        this.sessionRepository = sessionRepository;
        this.eventRepository = eventRepository;
        this.pageVisitRepository = pageVisitRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.pageVisitService = pageVisitService;
    }

    @Transactional
    public ResearchSession createSession(String title) {
        ResearchSession session = new ResearchSession();
        session.setTitle(title);
        session.setStatus("ACTIVE");
        session.setStartTime(Instant.now());
        return sessionRepository.save(session);
    }

    public ResearchSession getSession(String id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
    }

    public List<ResearchSession> listSessions() {
        return sessionRepository.findByOrderByStartTimeDesc();
    }

    @Transactional
    public ResearchSession updateSession(String id, String title, String status) {
        ResearchSession session = getSession(id);
        if (title != null && !title.isBlank()) {
            session.setTitle(title);
        }
        if (status != null && !status.isBlank()) {
            if ("COMPLETED".equals(status) && !"COMPLETED".equals(session.getStatus())) {
                session.setEndTime(Instant.now());
                pageVisitService.estimateDuration(id);
            }
            session.setStatus(status);
        }
        return sessionRepository.save(session);
    }

    public List<TimelineEntryResponse> getTimeline(String sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Session not found");
        }

        List<BrowserEvent> events = eventRepository.findBySessionIdOrderByTimestamp(sessionId);
        List<SearchQuery> searches = searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId);

        List<TimelineEntryResponse> timeline = new ArrayList<>();
        
        for (BrowserEvent event : events) {
            timeline.add(new TimelineEntryResponse(
                    event.getId().toString(),
                    "EVENT",
                    event.getTimestamp(),
                    event.getTitle() != null ? event.getTitle() : event.getEventType().name(),
                    event.getUrl(),
                    Map.of("eventType", event.getEventType().name())
            ));
        }
        
        for (SearchQuery search : searches) {
            timeline.add(new TimelineEntryResponse(
                    search.getId(),
                    "SEARCH",
                    search.getTimestamp(),
                    search.getQueryText(),
                    search.getSourceUrl(),
                    Map.of("engine", search.getEngine())
            ));
        }
        
        timeline.sort(Comparator.comparing(TimelineEntryResponse::timestamp));
        return timeline;
    }

    public List<PageVisit> getPages(String sessionId) {
        return pageVisitRepository.findBySessionIdOrderByFirstVisited(sessionId);
    }

    public List<SearchQuery> getSearches(String sessionId) {
        return searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId);
    }

    public MindMapResponse getMindMap(String sessionId) {
        List<PageVisit> pages = pageVisitRepository.findBySessionId(sessionId);
        List<SearchQuery> searches = searchQueryRepository.findBySessionId(sessionId);

        List<MindMapResponse.MindMapNode> nodes = new ArrayList<>();
        List<MindMapResponse.MindMapEdge> edges = new ArrayList<>();

        for (SearchQuery sq : searches) {
            nodes.add(new MindMapResponse.MindMapNode(
                    sq.getId(), "SEARCH", sq.getQueryText(), sq.getSourceUrl(), sq.getEngine(), sq.getTimestamp(), Map.of()
            ));
        }

        for (PageVisit pv : pages) {
            nodes.add(new MindMapResponse.MindMapNode(
                    pv.getId(), "PAGE", pv.getTitle(), pv.getUrl(), pv.getDomain(), pv.getFirstVisited(), Map.of("visits", pv.getVisitCount())
            ));
        }

        // Just simple edges from searches to pages if page was visited after search
        for (SearchQuery sq : searches) {
            for (PageVisit pv : pages) {
                if (pv.getFirstVisited().isAfter(sq.getTimestamp()) && 
                    pv.getFirstVisited().isBefore(sq.getTimestamp().plusSeconds(600))) {
                    edges.add(new MindMapResponse.MindMapEdge(
                            sq.getId(), pv.getId(), "RESULTS_IN", "Visited after search"
                    ));
                }
            }
        }

        return new MindMapResponse(sessionId, nodes, edges);
    }
}
