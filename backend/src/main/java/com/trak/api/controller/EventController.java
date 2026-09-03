package com.trak.api.controller;

import com.trak.api.dto.BrowserEventRequest;
import com.trak.api.dto.BrowserEventResponse;
import com.trak.api.mapper.DtoMapper;
import com.trak.domain.model.BrowserEvent;
import com.trak.service.EventIngestionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventIngestionService eventService;

    public EventController(EventIngestionService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<BrowserEventResponse> ingestEvent(@Valid @RequestBody BrowserEventRequest request) {
        BrowserEvent event = eventService.ingestEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(DtoMapper.toResponse(event));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<BrowserEventResponse>> ingestBatch(@Valid @RequestBody List<BrowserEventRequest> requests) {
        List<BrowserEvent> events = eventService.ingestBatch(requests);
        List<BrowserEventResponse> responses = events.stream()
                .map(DtoMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }
}
