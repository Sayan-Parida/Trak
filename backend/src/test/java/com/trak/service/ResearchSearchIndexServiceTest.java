package com.trak.service;

import com.trak.domain.model.PageVisit;
import com.trak.domain.model.ResearchSession;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.ResearchSessionRepository;
import com.trak.domain.repository.SearchQueryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ResearchSearchIndexServiceTest {
    @Autowired
    private ResearchSearchIndexService indexService;

    @Autowired
    private SearchQueryRepository searchRepository;

    @Autowired
    private PageVisitRepository pageRepository;

    @Autowired
    private ResearchSessionRepository sessionRepository;

    @Autowired
    private ResearchSearchIndexInitializer indexInitializer;

    @Test
    void createsIndexAndIndexesExistingResearchObjects() {
        ResearchSession session = session("Java research");
        SearchQuery search = search(session.getId(), "Java virtual threads");
        PageVisit page = page(session.getId(), "Virtual threads guide", "docs.oracle.com");
        sessionRepository.save(session);
        searchRepository.save(search);
        pageRepository.save(page);

        int count = indexService.rebuild(List.of(search), List.of(page), List.of(session));
        List<ResearchSearchIndexService.IndexHit> hits = indexService.search("\"virtual\" AND \"threads\"", 10);

        assertEquals(3, count);
        assertTrue(hits.stream().anyMatch(hit -> hit.documentType().equals("SEARCH") && hit.sourceId().equals(search.getId())));
        assertTrue(hits.stream().anyMatch(hit -> hit.documentType().equals("PAGE") && hit.sourceId().equals(page.getId())));
    }

    @Test
    void newDocumentsCanBeIndexedWithoutRestartAndRebuildIsIdempotent() {
        ResearchSession session = session("Kafka performance");
        sessionRepository.save(session);
        PageVisit page = page(session.getId(), "Kafka performance benchmarks", "kafka.apache.org");
        pageRepository.save(page);
        indexService.indexPage(page);
        long firstCount = indexService.count();
        indexService.indexPage(page);
        long secondCount = indexService.count();

        assertEquals(firstCount, secondCount);
        assertTrue(indexService.search("\"kafka\"", 10).stream().anyMatch(hit -> hit.sourceId().equals(page.getId())));
    }

    @Test
    void backfillsOnlyMissingCanonicalFieldsAndPreservesOriginalValues() {
        ResearchSession session = session("Backfill test");
        sessionRepository.save(session);
        SearchQuery blank = search(session.getId(), "  Java   Virtual Threads ");
        blank.setNormalizedQuery(null);
        SearchQuery populated = search(session.getId(), "Kafka");
        populated.setNormalizedQuery("custom-canonical");
        PageVisit blankPage = page(session.getId(), "  JVM   guide  ", "Docs.Example.COM");
        blankPage.setNormalizedTitle(null);
        blankPage.setNormalizedDomain(null);
        PageVisit populatedPage = page(session.getId(), "Keep This", "keep.example.com");
        populatedPage.setNormalizedTitle("preserved-title");
        populatedPage.setNormalizedDomain("preserved-domain");
        searchRepository.saveAll(List.of(blank, populated));
        pageRepository.saveAll(List.of(blankPage, populatedPage));

        indexInitializer.run();
        indexInitializer.run();

        assertEquals("  Java   Virtual Threads ", blank.getQueryText());
        assertEquals("java virtual threads", searchRepository.findById(blank.getId()).orElseThrow().getNormalizedQuery());
        assertEquals("custom-canonical", searchRepository.findById(populated.getId()).orElseThrow().getNormalizedQuery());
        assertEquals("jvm guide", pageRepository.findById(blankPage.getId()).orElseThrow().getNormalizedTitle());
        assertEquals("docs.example.com", pageRepository.findById(blankPage.getId()).orElseThrow().getNormalizedDomain());
        assertEquals("preserved-title", pageRepository.findById(populatedPage.getId()).orElseThrow().getNormalizedTitle());
        assertEquals("preserved-domain", pageRepository.findById(populatedPage.getId()).orElseThrow().getNormalizedDomain());
    }

    private ResearchSession session(String title) {
        ResearchSession session = new ResearchSession();
        session.setTitle(title);
        session.setStartTime(Instant.parse("2026-01-01T00:00:00Z"));
        return session;
    }

    private SearchQuery search(String sessionId, String text) {
        SearchQuery search = new SearchQuery();
        search.setId(UUID.randomUUID().toString());
        search.setSessionId(sessionId);
        search.setQueryText(text);
        search.setNormalizedQuery(text.toLowerCase());
        search.setEngine("Google");
        search.setSourceUrl("https://google.com/search");
        search.setTimestamp(Instant.parse("2026-01-01T00:01:00Z"));
        return search;
    }

    private PageVisit page(String sessionId, String title, String domain) {
        PageVisit page = new PageVisit();
        page.setId(UUID.randomUUID().toString());
        page.setSessionId(sessionId);
        page.setTitle(title);
        page.setNormalizedTitle(title.toLowerCase());
        page.setDomain(domain);
        page.setNormalizedDomain(domain);
        page.setUrl("https://" + domain + "/guide");
        page.setFirstVisited(Instant.parse("2026-01-01T00:02:00Z"));
        page.setLastVisited(page.getFirstVisited());
        return page;
    }
}
