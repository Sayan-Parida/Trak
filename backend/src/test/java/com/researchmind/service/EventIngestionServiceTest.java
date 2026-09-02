package com.researchmind.service;

import com.researchmind.api.dto.BrowserEventRequest;
import com.researchmind.domain.model.BrowserEvent;
import com.researchmind.domain.repository.BrowserEventRepository;
import com.researchmind.domain.repository.PageVisitRepository;
import com.researchmind.domain.repository.ResearchSessionRepository;
import com.researchmind.domain.repository.SearchQueryRepository;
import com.researchmind.domain.model.ResearchSession;
import com.researchmind.exception.DuplicateEventException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class EventIngestionServiceTest {

    @Autowired
    private EventIngestionService eventIngestionService;

    @Autowired
    private BrowserEventRepository eventRepository;

    @Autowired
    private PageVisitRepository pageVisitRepository;

    @Autowired
    private SearchQueryRepository searchQueryRepository;

    @Autowired
    private ResearchSessionRepository sessionRepository;

    private String sessionId;

    @BeforeEach
    void setUp() {
        ResearchSession session = new ResearchSession();
        session.setTitle("Test Session");
        session.setStartTime(Instant.now());
        sessionRepository.save(session);
        sessionId = session.getId();
    }

    @Test
    void ingestEvent_ValidSearchEvent_CreatesEventPageVisitAndSearchQuery() {
        BrowserEventRequest req = new BrowserEventRequest(
                "NAVIGATION",
                "https://www.google.com/search?q=spring+boot",
                "spring boot - Google Search",
                1,
                1,
                "link",
                "",
                Instant.now().toEpochMilli(),
                sessionId
        );

        BrowserEvent savedEvent = eventIngestionService.ingestEvent(req);

        assertNotNull(savedEvent.getId());
        assertEquals("NAVIGATION", savedEvent.getEventType().name());
        
        var pageVisits = pageVisitRepository.findBySessionId(sessionId);
        assertEquals(1, pageVisits.size());
        assertEquals("www.google.com", pageVisits.get(0).getDomain());

        var searches = searchQueryRepository.findBySessionId(sessionId);
        assertEquals(1, searches.size());
        assertEquals("spring boot", searches.get(0).getQueryText());
        assertEquals("Google", searches.get(0).getEngine());
    }

    @Test
    void ingestEvent_DuplicateEvent_ThrowsException() {
        long timestamp = Instant.now().toEpochMilli();
        BrowserEventRequest req = new BrowserEventRequest(
                "TAB_CREATED",
                "https://example.com",
                "Example",
                1,
                1,
                "typed",
                "",
                timestamp,
                sessionId
        );

        eventIngestionService.ingestEvent(req);

        assertThrows(DuplicateEventException.class, () -> {
            eventIngestionService.ingestEvent(req);
        });
    }
}
