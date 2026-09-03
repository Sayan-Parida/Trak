package com.trak.service;

import com.trak.api.dto.ResearchGraphResponse;
import com.trak.api.dto.ResearchSearchResponse;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.ResearchSession;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.ResearchSessionRepository;
import com.trak.domain.repository.SearchQueryRepository;
import com.trak.processing.text.ResearchTextNormalizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResearchSearchService {
    private static final int MAX_RESULTS = 50;
    private final SearchQueryRepository searchRepository;
    private final PageVisitRepository pageRepository;
    private final ResearchSessionRepository sessionRepository;
    private final ResearchGraphService graphService;
    private final ResearchSearchIndexService indexService;

    public ResearchSearchService(SearchQueryRepository searchRepository, PageVisitRepository pageRepository,
                                 ResearchSessionRepository sessionRepository, ResearchGraphService graphService,
                                 ResearchSearchIndexService indexService) {
        this.searchRepository = searchRepository;
        this.pageRepository = pageRepository;
        this.sessionRepository = sessionRepository;
        this.graphService = graphService;
        this.indexService = indexService;
    }

    @Transactional(readOnly = true)
    public ResearchSearchResponse search(String query) {
        return search(query, MAX_RESULTS, null, null, null);
    }

    @Transactional(readOnly = true)
    public ResearchSearchResponse search(String query, Integer requestedLimit, String sessionId, String type, String domain) {
        String normalizedQuery = ResearchTextNormalizer.normalize(query);
        Set<String> terms = ResearchTextNormalizer.terms(normalizedQuery);
        if (terms.isEmpty()) return new ResearchSearchResponse(query == null ? "" : query, normalizedQuery, 0, List.of());
        int limit = requestedLimit == null ? MAX_RESULTS : Math.max(1, Math.min(MAX_RESULTS, requestedLimit));
        String matchQuery = terms.stream().map(term -> "\"" + term.replace("\"", "\"\"") + "\"").collect(Collectors.joining(" AND "));
        Map<String, Candidate> candidates = hydrateCandidates(indexService.search(matchQuery, MAX_RESULTS));
        candidates.values().removeIf(candidate -> (sessionId != null && !sessionId.equals(candidate.sessionId()))
                || (type != null && !type.equalsIgnoreCase(candidate.type()))
                || (domain != null && (candidate.domain() == null || !domain.equalsIgnoreCase(candidate.domain()))));

        Instant latest = candidates.values().stream().map(Candidate::timestamp).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(Instant.now());
        Map<String, List<ResearchSearchResponse.GraphContext>> graphContexts = buildContexts(candidates.values());
        List<ResearchSearchResponse.ResearchResult> rankedResults = candidates.values().stream()
                .map(candidate -> candidate.toResult(terms, normalizedQuery, latest, graphContexts.getOrDefault(candidate.sessionId(), List.of())))
                .sorted(Comparator.comparing(ResearchSearchResponse.ResearchResult::score).reversed()
                        .thenComparing(ResearchSearchResponse.ResearchResult::type)
                        .thenComparing(ResearchSearchResponse.ResearchResult::id))
            .toList();
        List<ResearchSearchResponse.ResearchResult> results = rankedResults.stream()
                .limit(limit)
                .toList();
        return new ResearchSearchResponse(query == null ? "" : query, normalizedQuery, rankedResults.size(), results);
    }

    private Map<String, Candidate> hydrateCandidates(List<ResearchSearchIndexService.IndexHit> hits) {
        Map<String, Candidate> candidates = new HashMap<>();
        for (ResearchSearchIndexService.IndexHit hit : hits) {
            double ftsScore = ftsScore(hit, hits);
            if ("SEARCH".equals(hit.documentType())) searchRepository.findById(hit.sourceId()).ifPresent(item -> addSearch(candidates, item, ftsScore));
            if ("PAGE".equals(hit.documentType())) pageRepository.findById(hit.sourceId()).ifPresent(item -> addPage(candidates, item, ftsScore));
            if ("SESSION".equals(hit.documentType())) sessionRepository.findById(hit.sourceId()).ifPresent(item -> addSession(candidates, item, ftsScore));
        }
        return candidates;
    }

    private double ftsScore(ResearchSearchIndexService.IndexHit hit, List<ResearchSearchIndexService.IndexHit> hits) {
        double best = hits.stream().mapToDouble(ResearchSearchIndexService.IndexHit::bm25Rank).min().orElse(hit.bm25Rank());
        double worst = hits.stream().mapToDouble(ResearchSearchIndexService.IndexHit::bm25Rank).max().orElse(hit.bm25Rank());
        return best == worst ? 1.0 : (worst - hit.bm25Rank()) / (worst - best);
    }

    private void addSearch(Map<String, Candidate> candidates, SearchQuery search) {
        addSearch(candidates, search, 0.0);
    }

    private void addSearch(Map<String, Candidate> candidates, SearchQuery search, double ftsScore) {
        candidates.putIfAbsent("SEARCH:" + search.getId(), Candidate.forSearch(search, ftsScore));
    }

    private void addPage(Map<String, Candidate> candidates, PageVisit page) {
        addPage(candidates, page, 0.0);
    }

    private void addPage(Map<String, Candidate> candidates, PageVisit page, double ftsScore) {
        candidates.putIfAbsent("PAGE:" + page.getId(), Candidate.forPage(page, ftsScore));
    }

    private void addSession(Map<String, Candidate> candidates, ResearchSession session) {
        addSession(candidates, session, 0.0);
    }

    private void addSession(Map<String, Candidate> candidates, ResearchSession session, double ftsScore) {
        candidates.putIfAbsent("SESSION:" + session.getId(), Candidate.forSession(session, ftsScore));
    }

    private Map<String, List<ResearchSearchResponse.GraphContext>> buildContexts(Collection<Candidate> candidates) {
        return candidates.stream().map(Candidate::sessionId).filter(Objects::nonNull).distinct().collect(Collectors.toMap(
                id -> id,
                id -> graphService.getGraph(id).edges().stream().map(this::toContext).toList()));
    }

    private ResearchSearchResponse.GraphContext toContext(ResearchGraphResponse.ResearchGraphEdge edge) {
        return new ResearchSearchResponse.GraphContext(edge.source(), edge.target(), edge.relationshipType(), edge.reason());
    }

    private record Candidate(String id, String type, String label, String sessionId, Instant timestamp, String url,
                             String domain, int visitCount, String searchableText, double importance, List<String> baseReasons,
                             double ftsScore) {
        static Candidate forSearch(SearchQuery item, double ftsScore) {
            return new Candidate("search:" + item.getId(), "SEARCH", item.getQueryText(), item.getSessionId(), item.getTimestamp(),
                    item.getSourceUrl(), null, 0, item.getQueryText(), 0.4, List.of("Recorded research search"), ftsScore);
        }

        static Candidate forPage(PageVisit item, double ftsScore) {
            double visitSignal = Math.min(1.0, item.getVisitCount() / 5.0);
            double dwellSignal = Math.min(1.0, item.getDurationMs() / 300000.0);
            double importance = 0.4 * visitSignal + 0.2 * dwellSignal;
            List<String> reasons = new ArrayList<>();
            if (item.getVisitCount() > 1) reasons.add("Visited " + item.getVisitCount() + " times");
            if (item.getDurationMs() > 0) reasons.add("Dwell time recorded");
            if (reasons.isEmpty()) reasons.add("Page recorded in research session");
            return new Candidate("page:" + item.getId(), "PAGE", item.getTitle() == null ? item.getUrl() : item.getTitle(), item.getSessionId(),
                    item.getFirstVisited(), item.getUrl(), item.getDomain(), item.getVisitCount(),
                        String.join(" ", item.getTitle() == null ? "" : item.getTitle(),
                            item.getDomain() == null ? "" : item.getDomain(), item.getUrl()), importance, reasons, ftsScore);
        }

        static Candidate forSession(ResearchSession item, double ftsScore) {
            return new Candidate("session:" + item.getId(), "SESSION", item.getTitle() == null ? item.getId() : item.getTitle(),
                    item.getId(), item.getStartTime(), null, null, 0, item.getTitle() == null ? "" : item.getTitle(),
                    0.5, List.of("Research session context"), ftsScore);
        }

        ResearchSearchResponse.ResearchResult toResult(Set<String> queryTerms, String normalizedQuery, Instant latest,
                                                        List<ResearchSearchResponse.GraphContext> context) {
            Set<String> matched = ResearchTextNormalizer.terms(searchableText).stream().filter(queryTerms::contains).collect(Collectors.toCollection(LinkedHashSet::new));
            double termScore = (double) matched.size() / queryTerms.size();
            boolean exact = !normalizedQuery.isBlank() && ResearchTextNormalizer.normalize(searchableText).contains(normalizedQuery);
            double phraseBonus = exact ? 0.2 : 0.0;
            double recency = latest.equals(timestamp) ? 1.0 : Math.max(0.0, 1.0 - Duration.between(timestamp, latest).toHours() / 720.0);
            double graphSignal = Math.min(1.0, context.stream().filter(edge -> edge.source().equals(id) || edge.target().equals(id)).count() / 4.0);
            double score = Math.min(1.0, 0.35 * ftsScore + 0.35 * termScore + phraseBonus + 0.15 * importance + 0.10 * recency + 0.05 * graphSignal);
            List<String> reasons = new ArrayList<>(baseReasons);
            if (exact) reasons.add("Exact normalized phrase match");
            if (!matched.isEmpty()) reasons.add("Matched terms: " + String.join(", ", matched));
            if (graphSignal > 0) reasons.add("Connected to research graph");
            if (recency > 0.8) reasons.add("Recent research activity");
            return new ResearchSearchResponse.ResearchResult(id, type, label, sessionId, timestamp, url, domain, visitCount,
                    score, importance, List.copyOf(matched), List.copyOf(reasons), Map.of("normalizedQuery", normalizedQuery), context);
        }
    }
}
