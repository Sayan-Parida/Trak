package com.trak.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trak.api.dto.ResearchMemoryResponse;
import com.trak.api.dto.SessionCreateRequest;
import com.trak.api.dto.SessionUpdateRequest;
import com.trak.domain.model.EventType;
import com.trak.domain.model.ResearchSession;
import com.trak.service.ResearchMemoryService;
import com.trak.service.ResearchSessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ResearchSessionService sessionService;

    @Autowired
    private ResearchMemoryService researchMemoryService;

    @Test
    void createSession() throws Exception {
        SessionCreateRequest req = new SessionCreateRequest("My New Session");
        
        mockMvc.perform(post("/api/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("My New Session"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void createSessionWithoutTitle() throws Exception {
        mockMvc.perform(post("/api/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").doesNotExist())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getSession() throws Exception {
        ResearchSession session = sessionService.createSession("Test Session for Get");

        mockMvc.perform(get("/api/sessions/" + session.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Session for Get"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void updateSession() throws Exception {
        ResearchSession session = sessionService.createSession("Test Session for Update");

        SessionUpdateRequest updateReq = new SessionUpdateRequest("Updated Title", "COMPLETED");

        mockMvc.perform(put("/api/sessions/" + session.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void getSessionNotFound() throws Exception {
        mockMvc.perform(get("/api/sessions/non-existent-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getPagesAndSearchesNotFound() throws Exception {
        mockMvc.perform(get("/api/sessions/non-existent-id/pages"))
            .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/sessions/non-existent-id/searches"))
            .andExpect(status().isNotFound());
    }

    @Test
    void getPagesAndSearchesForEmptySession() throws Exception {
        ResearchSession session = sessionService.createSession("Empty Session");

        mockMvc.perform(get("/api/sessions/" + session.getId() + "/pages"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));

        mockMvc.perform(get("/api/sessions/" + session.getId() + "/searches"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }

    // --- M4 Research Memory Tests ---

    @Test
    void getResearchMemoryEmptySession() throws Exception {
        ResearchSession session = sessionService.createSession("Empty Session");

        mockMvc.perform(get("/api/sessions/" + session.getId() + "/research-memory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(session.getId()))
                .andExpect(jsonPath("$.title").value("Empty Session"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.startTime").isNotEmpty())
                .andExpect(jsonPath("$.activity").isEmpty())
                .andExpect(jsonPath("$.searches").isEmpty())
                .andExpect(jsonPath("$.pages").isEmpty())
                .andExpect(jsonPath("$.domains").isEmpty())
                .andExpect(jsonPath("$.lastKnownState.type").doesNotExist())
                .andExpect(jsonPath("$.summary.totalEvents").value(0))
                .andExpect(jsonPath("$.summary.totalPageVisits").value(0))
                .andExpect(jsonPath("$.summary.totalSearches").value(0))
                .andExpect(jsonPath("$.summary.uniquePages").value(0))
                .andExpect(jsonPath("$.summary.uniqueSearches").value(0))
                .andExpect(jsonPath("$.summary.uniqueDomains").value(0))
                .andExpect(jsonPath("$.resume.lastVisitedPageTitle").doesNotExist())
                .andExpect(jsonPath("$.resume.lastSearchQuery").doesNotExist())
                .andExpect(jsonPath("$.resume.lastActivityType").doesNotExist());
    }

    @Test
    void getResearchMemoryPageOnlySession() throws Exception {
        ResearchSession session = sessionService.createSession("Page Only Session");

        String pageUrl = "https://example.com/page1";
        String pageTitle = "Example Page 1";
        PageVisit page = researchMemoryService.getClass().getDeclaredMethod("createOrUpdatePageVisit", String.class, String.class, String.class, Instant.class).invoke(researchMemoryService, pageUrl, pageTitle, session.getId(), Instant.now());

        mockMvc.perform(get("/api/sessions/" + session.getId() + "/research-memory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(session.getId()))
                .andExpect(jsonPath("$.title").value("Page Only Session"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.pages").exists())
                .andExpect(jsonPath("$.pages.length()").value(1))
                .andExpect(jsonPath("$.pages[0].url").value(pageUrl))
                .andExpect(jsonPath("$.pages[0].title").value(pageTitle))
                .andExpect(jsonPath("$.activity.length()").value(1))
                .andExpect(jsonPath("$.activity[0].type").value("NAVIGATION"))
                .andExpect(jsonPath("$.summary.totalPageVisits").value(1))
                .andExpect(jsonPath("$.summary.uniquePages").value(1))
                .andExpect(jsonPath("$.summary.totalEvents").value(1))
                .andExpect(jsonPath("$.summary.totalSearches").value(0));
    }

    @Test
    void getResearchMemorySearchOnlySession() throws Exception {
        ResearchSession session = sessionService.createSession("Search Only Session");

        mockMvc.perform(get("/api/sessions/" + session.getId() + "/research-memory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.searches").exists())
                .andExpect(jsonPath("$.searches.length()").value(1))
                .andExpect(jsonPath("$.searches[0].queryText").doesNotExist())
                .andExpect(jsonPath("$.activity.length()").value(1))
                .andExpect(jsonPath("$.activity[0].type").value("SEARCH"))
                .andExpect(jsonPath("$.summary.totalSearches").value(1))
                .andExpect(jsonPath("$.summary.totalEvents").value(1));
    }

    @Test
    void getResearchMemoryActiveSession() throws Exception {
        ResearchSession session = sessionService.createSession("Active Session");

        mockMvc.perform(get("/api/sessions/" + session.getId() + "/research-memory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.endTime").doesNotExist())
                .andExpect(jsonPath("$.duration").doesNotExist());
    }

    @Test
    void getResearchMemoryCompletedSession() throws Exception {
        ResearchSession session = sessionService.createSession("Completed Session");

        sessionService.updateSession(session.getId(), null, "COMPLETED");

        mockMvc.perform(get("/api/sessions/" + session.getId() + "/research-memory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.endTime").isNotEmpty())
                .andExpect(jsonPath("$.duration").isNotEmpty());
    }

    @Test
    void getResearchMemoryInvalidSessionId() throws Exception {
        mockMvc.perform(get("/api/sessions/non-existent-id/research-memory"))
                .andExpect(status().isNotFound());
    }
}