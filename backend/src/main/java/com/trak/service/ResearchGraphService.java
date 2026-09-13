package com.trak.service;

import com.trak.api.dto.ResearchGraphResponse;
import com.trak.domain.repository.BrowserEventRepository;
import com.trak.domain.repository.SearchQueryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResearchGraphService {
    private final ResearchSessionService sessionService;
    private final BrowserEventRepository eventRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final ResearchGraphBuilder graphBuilder = new ResearchGraphBuilder();

    public ResearchGraphService(ResearchSessionService sessionService,
                                BrowserEventRepository eventRepository,
                                SearchQueryRepository searchQueryRepository) {
        this.sessionService = sessionService;
        this.eventRepository = eventRepository;
        this.searchQueryRepository = searchQueryRepository;
    }

    @Transactional(readOnly = true)
    public ResearchGraphResponse getGraph(String sessionId) {
        var session = sessionService.getSession(sessionId);
        return graphBuilder.build(sessionId, session.getStartTime(), session.getEndTime(),
                eventRepository.findBySessionIdOrderByTimestamp(sessionId),
                sessionService.getPages(sessionId),
                searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId));
    }
}
