package com.trak.api.mapper;

import com.trak.api.dto.BrowserEventResponse;
import com.trak.api.dto.PageVisitResponse;
import com.trak.api.dto.SearchQueryResponse;
import com.trak.api.dto.SessionResponse;
import com.trak.domain.model.BrowserEvent;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.ResearchSession;
import com.trak.domain.model.SearchQuery;

public class DtoMapper {
    
    public static SessionResponse toResponse(ResearchSession session, long eventCount, long pageCount, long searchCount) {
        return new SessionResponse(
                session.getId(),
                session.getTitle(),
                session.getStatus(),
                session.getStartTime(),
                session.getEndTime(),
                eventCount,
                pageCount,
                searchCount
        );
    }

    public static BrowserEventResponse toResponse(BrowserEvent event) {
        return new BrowserEventResponse(
                event.getId(),
                event.getEventType().name(),
                event.getUrl(),
                event.getTitle(),
                event.getTabId(),
                event.getTimestamp()
        );
    }

    public static PageVisitResponse toResponse(PageVisit visit) {
        return new PageVisitResponse(
                visit.getId(),
                visit.getUrl(),
                visit.getDomain(),
                visit.getTitle(),
                visit.getFirstVisited(),
                visit.getLastVisited(),
                visit.getVisitCount(),
                visit.getDurationMs()
        );
    }

    public static SearchQueryResponse toResponse(SearchQuery query) {
        return new SearchQueryResponse(
                query.getId(),
                query.getQueryText(),
                query.getEngine(),
                query.getSourceUrl(),
                query.getTimestamp()
        );
    }
}
