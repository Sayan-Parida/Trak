package com.trak.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trak.api.dto.SessionCreateRequest;
import com.trak.api.dto.SessionUpdateRequest;
import com.trak.domain.model.ResearchSession;
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
}
