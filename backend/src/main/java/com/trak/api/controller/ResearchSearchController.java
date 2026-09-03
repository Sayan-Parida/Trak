package com.trak.api.controller;

import com.trak.api.dto.ResearchSearchResponse;
import com.trak.service.ResearchSearchService;
import com.trak.service.ResearchSearchIndexInitializer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/research")
public class ResearchSearchController {
    private final ResearchSearchService searchService;
    private final ResearchSearchIndexInitializer indexInitializer;

    public ResearchSearchController(ResearchSearchService searchService, ResearchSearchIndexInitializer indexInitializer) {
        this.searchService = searchService;
        this.indexInitializer = indexInitializer;
    }

    @GetMapping("/search")
    public ResponseEntity<ResearchSearchResponse> search(@RequestParam(defaultValue = "") String q,
                                                         @RequestParam(required = false) Integer limit,
                                                         @RequestParam(required = false) String session,
                                                         @RequestParam(required = false) String type,
                                                         @RequestParam(required = false) String domain) {
        return ResponseEntity.ok(searchService.search(q, limit, session, type, domain));
    }

    @PostMapping("/search-index/rebuild")
    public ResponseEntity<Integer> rebuildSearchIndex() {
        return ResponseEntity.ok(indexInitializer.rebuild());
    }
}