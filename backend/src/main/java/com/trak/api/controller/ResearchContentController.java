package com.trak.api.controller;

import com.trak.api.dto.ContentIngestRequest;
import com.trak.api.dto.ContentIngestResponse;
import com.trak.api.dto.ContentStatusResponse;
import com.trak.content.retrieval.ResearchContentRetriever;
import com.trak.content.retrieval.ResearchRetrievalRequest;
import com.trak.content.retrieval.RetrievedResearchContent;
import com.trak.service.ResearchContentService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * M5 research content / evidence APIs. Structured data only; no chat, no LLM.
 * Session-scoped retrieval keeps results tied to the investigation.
 */
@RestController
@RequestMapping("/api/research/content")
public class ResearchContentController {

    private final ResearchContentService contentService;
    private final ResearchContentRetriever retriever;

    public ResearchContentController(ResearchContentService contentService,
                                     ResearchContentRetriever retriever) {
        this.contentService = contentService;
        this.retriever = retriever;
    }

    @PostMapping("/ingest")
    public ResponseEntity<ContentIngestResponse> ingest(@Valid @RequestBody ContentIngestRequest request) {
        ContentIngestResponse response = contentService.ingest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/retrieve")
    public ResponseEntity<List<RetrievedResearchContent>> retrieve(
            @RequestParam String query,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        ResearchRetrievalRequest req = ResearchRetrievalRequest.of(
                query, emptyToNull(sessionId), emptyToNull(domain), null, null, limit);
        return ResponseEntity.ok(retriever.retrieve(req));
    }

    @GetMapping("/sessions/{sessionId}/research-content")
    public ResponseEntity<List<RetrievedResearchContent>> retrieveForSession(
            @PathVariable String sessionId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.ok(retriever.recentForSession(sessionId, limit));
        }
        ResearchRetrievalRequest req = ResearchRetrievalRequest.of(
                query, sessionId, emptyToNull(domain), null, null, limit);
        return ResponseEntity.ok(retriever.retrieve(req));
    }

    @GetMapping("/status")
    public ResponseEntity<ContentStatusResponse> status(@RequestParam String pageVisitId) {
        return ResponseEntity.ok(contentService.statusForVisit(pageVisitId));
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
