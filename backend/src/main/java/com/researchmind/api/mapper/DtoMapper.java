package com.researchmind.api.mapper;

import com.researchmind.api.dto.BrowserEventResponse;
import com.researchmind.api.dto.PageVisitResponse;
import com.researchmind.api.dto.SearchQueryResponse;
import com.researchmind.api.dto.SessionResponse;
import com.researchmind.domain.model.BrowserEvent;
import com.researchmind.domain.model.PageVisit;
import com.researchmind.domain.model.ResearchSession;
import com.researchmind.domain.model.SearchQuery;

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
