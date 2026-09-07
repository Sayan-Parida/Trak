package com.trak.content.retrieval;

import com.trak.content.embedding.EmbeddingProvider;
import com.trak.content.embedding.EmbeddingResult;
import com.trak.content.vector.VectorStore;
import com.trak.domain.model.ContentChunk;
import com.trak.domain.model.ContentDocument;
import com.trak.domain.model.ContentVersion;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.PageVisitContentCapture;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.ContentChunkRepository;
import com.trak.domain.repository.ContentDocumentRepository;
import com.trak.domain.repository.ContentVersionRepository;
import com.trak.domain.repository.PageVisitContentCaptureRepository;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.SearchQueryRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Research-aware retrieval implementation. Session/domain/time/source
 * filters constrain the candidate set BEFORE ranking, so results remain
 * scoped to the investigation — never a flat global embedding corpus.
 */
@Service
public class ResearchContentRetrieverImpl implements ResearchContentRetriever {

    private final EmbeddingProvider embeddingProvider;
    private final VectorStore vectorStore;
    private final ContentChunkRepository chunkRepository;
    private final ContentVersionRepository versionRepository;
    private final ContentDocumentRepository documentRepository;
    private final PageVisitContentCaptureRepository captureRepository;
    private final PageVisitRepository pageVisitRepository;
    private final SearchQueryRepository searchQueryRepository;

    public ResearchContentRetrieverImpl(
            EmbeddingProvider embeddingProvider,
            VectorStore vectorStore,
            ContentChunkRepository chunkRepository,
            ContentVersionRepository versionRepository,
            ContentDocumentRepository documentRepository,
            PageVisitContentCaptureRepository captureRepository,
            PageVisitRepository pageVisitRepository,
            SearchQueryRepository searchQueryRepository) {
        this.embeddingProvider = embeddingProvider;
        this.vectorStore = vectorStore;
        this.chunkRepository = chunkRepository;
        this.versionRepository = versionRepository;
        this.documentRepository = documentRepository;
        this.captureRepository = captureRepository;
        this.pageVisitRepository = pageVisitRepository;
        this.searchQueryRepository = searchQueryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RetrievedResearchContent> retrieve(ResearchRetrievalRequest request) {
        if (request == null) return List.of();
        if (request.priority() == ResearchRetrievalRequest.RetrievalPriority.RECENT
                || request.query() == null || request.query().isBlank()) {
            return recentForSession(request.sessionId(), request.limit());
        }

        // 1. Constrain candidates by research context first.
        Set<String> allowedChunkIds = allowedChunkIds(request);
        boolean constrained = request.sessionId() != null || request.domain() != null
                || request.sourceContentDocumentId().isPresent() || request.contentHash().isPresent();

        // 2. Embed the query.
        EmbeddingResult queryEmb = embeddingProvider.embed(request.query());
        List<VectorStore.ScoredId> scored;
        if (!queryEmb.success() || queryEmb.vector() == null) {
            // Embedding unavailable: fall back to recent-in-context evidence (score 0),
            // never fake similarity.
            return withScores(recentForSession(request.sessionId(), request.limit()), 0.0, request);
        } else {
            scored = vectorStore.similaritySearch(queryEmb.vector(), Map.of(), request.limit() * 4);
        }

        // 3. Intersect with research-context constraint, preserving similarity order.
        List<VectorStore.ScoredId> filtered = new ArrayList<>();
        Set<String> seenHashes = new HashSet<>();
        for (VectorStore.ScoredId s : scored) {
            if (constrained && !allowedChunkIds.contains(s.chunkId())) continue;
            if (request.priority() == ResearchRetrievalRequest.RetrievalPriority.SOURCE_DEDUP) {
                String h = chunkHash(s.chunkId());
                if (h != null && !seenHashes.add(h)) continue;
            }
            filtered.add(s);
            if (filtered.size() >= request.limit()) break;
        }

        // 4. Assemble provenance.
        List<RetrievedResearchContent> out = new ArrayList<>();
        for (VectorStore.ScoredId s : filtered) {
            RetrievedResearchContent r = assemble(s.chunkId(), s.score(), request);
            if (r != null) out.add(r);
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RetrievedResearchContent> recentForSession(String sessionId, int limit) {
        int k = Math.max(1, Math.min(limit <= 0 ? 10 : limit, 100));
        List<PageVisit> visits = sessionId == null
                ? pageVisitRepository.findAll()
                : pageVisitRepository.findBySessionId(sessionId);
        Map<String, PageVisit> visitById = new HashMap<>();
        for (PageVisit v : visits) visitById.put(v.getId(), v);

        List<PageVisitContentCapture> captures = captureRepository.findAll().stream()
                .filter(c -> "SUCCESS".equals(c.getStatus()))
                .filter(c -> sessionId == null || (visitById.containsKey(c.getPageVisitId())))
                .sorted(Comparator.comparing(PageVisitContentCapture::getCapturedAt).reversed())
                .toList();

        List<RetrievedResearchContent> out = new ArrayList<>();
        Set<String> seenDocs = new HashSet<>();
        for (PageVisitContentCapture cap : captures) {
            if (cap.getContentVersionId() == null) continue;
            List<ContentChunk> chunks = chunkRepository.findByContentVersionIdOrderByChunkIndex(cap.getContentVersionId());
            for (ContentChunk chunk : chunks) {
                RetrievedResearchContent r = assemble(chunk.getId(), null, null);
                if (r != null) {
                    out.add(r);
                    if (out.size() >= k) return out;
                }
            }
            if (out.size() >= k) break;
            seenDocs.add(cap.getContentDocumentId());
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RetrievedResearchContent> fromDocument(String contentDocumentId, String query, int limit) {
        ResearchRetrievalRequest req = new ResearchRetrievalRequest(
                query, null, null, null, null, limit,
                java.util.Optional.ofNullable(contentDocumentId),
                java.util.Optional.empty(), java.util.Optional.empty(),
                ResearchRetrievalRequest.RetrievalPriority.SEMANTIC);
        if (query == null || query.isBlank()) {
            List<ContentVersion> versions = versionRepository.findByContentDocumentIdOrderByVersionDesc(contentDocumentId);
            List<RetrievedResearchContent> out = new ArrayList<>();
            for (ContentVersion v : versions) {
                for (ContentChunk c : chunkRepository.findByContentVersionIdOrderByChunkIndex(v.getId())) {
                    RetrievedResearchContent r = assemble(c.getId(), null, req);
                    if (r != null) out.add(r);
                    if (out.size() >= req.limit()) return out;
                }
            }
            return out;
        }
        return retrieve(req);
    }

    // ---- helpers ----

    private Set<String> allowedChunkIds(ResearchRetrievalRequest request) {
        // Resolve allowed versions via captures (session/time/domain) then expand to chunks.
        List<ContentVersion> versions = versionRepository.findAll();
        Map<String, ContentVersion> versionById = new HashMap<>();
        for (ContentVersion v : versions) versionById.put(v.getId(), v);
        Map<String, ContentDocument> docById = new HashMap<>();
        for (ContentDocument d : documentRepository.findAll()) docById.put(d.getId(), d);
        Map<String, PageVisit> visitById = new HashMap<>();
        for (PageVisit v : pageVisitRepository.findAll()) visitById.put(v.getId(), v);

        Set<String> allowedVersionIds = new HashSet<>();
        for (PageVisitContentCapture cap : captureRepository.findAll()) {
            if (!"SUCCESS".equals(cap.getStatus()) || cap.getContentVersionId() == null) continue;
            PageVisit visit = visitById.get(cap.getPageVisitId());
            ContentDocument doc = docById.get(cap.getContentDocumentId());
            if (request.sessionId() != null) {
                if (visit == null || !request.sessionId().equals(visit.getSessionId())) continue;
            }
            if (request.domain() != null && !request.domain().isBlank()) {
                String d = doc != null ? doc.getDomain() : (visit != null ? visit.getDomain() : null);
                if (d == null || !d.equalsIgnoreCase(request.domain())) continue;
            }
            if (request.timeFrom() != null && cap.getCapturedAt() != null && cap.getCapturedAt().isBefore(request.timeFrom())) continue;
            if (request.timeTo() != null && cap.getCapturedAt() != null && cap.getCapturedAt().isAfter(request.timeTo())) continue;
            if (request.sourceContentDocumentId().isPresent()
                    && !request.sourceContentDocumentId().get().equals(cap.getContentDocumentId())) continue;
            allowedVersionIds.add(cap.getContentVersionId());
        }
        if (request.contentHash().isPresent()) {
            allowedVersionIds.removeIf(vid -> {
                ContentVersion v = versionById.get(vid);
                return v == null || !request.contentHash().get().equals(v.getContentHash());
            });
        }
        if (!request.searchId().isPresent() || request.searchId().get().isBlank()) {
            return expandToChunks(allowedVersionIds);
        }
        // Further constrain to versions whose capture visit matches the search's page visit.
        SearchQuery search = searchQueryRepository.findById(request.searchId().get()).orElse(null);
        if (search == null) return expandToChunks(allowedVersionIds);
        Set<String> narrowed = new HashSet<>();
        for (PageVisitContentCapture cap : captureRepository.findAll()) {
            if (!allowedVersionIds.contains(cap.getContentVersionId())) continue;
            if (search.getPageVisitId() != null && search.getPageVisitId().equals(cap.getPageVisitId())) {
                narrowed.add(cap.getContentVersionId());
            }
        }
        return expandToChunks(narrowed.isEmpty() ? allowedVersionIds : narrowed);
    }

    private Set<String> expandToChunks(Set<String> versionIds) {
        Set<String> out = new HashSet<>();
        if (versionIds.isEmpty()) return out;
        for (ContentChunk c : chunkRepository.findByContentVersionIdInOrderByChunkIndex(new ArrayList<>(versionIds))) {
            out.add(c.getId());
        }
        return out;
    }

    private String chunkHash(String chunkId) {
        return chunkRepository.findById(chunkId).map(ContentChunk::getContentHash).orElse(null);
    }

    private List<RetrievedResearchContent> withScores(List<RetrievedResearchContent> base, double score,
                                                      ResearchRetrievalRequest request) {
        List<RetrievedResearchContent> out = new ArrayList<>();
        for (RetrievedResearchContent r : base) {
            out.add(new RetrievedResearchContent(r.chunkId(), r.content(), score,
                    r.provenance(), r.extractionMethod(), r.extractedAt()));
            if (out.size() >= (request != null ? request.limit() : 10)) break;
        }
        return out;
    }

    private RetrievedResearchContent assemble(String chunkId, Double score, ResearchRetrievalRequest request) {
        ContentChunk chunk = chunkRepository.findById(chunkId).orElse(null);
        if (chunk == null) return null;
        ContentVersion version = versionRepository.findById(chunk.getContentVersionId()).orElse(null);
        if (version == null) return null;
        ContentDocument doc = documentRepository.findById(version.getContentDocumentId()).orElse(null);
        if (doc == null) return null;

        // Prefer the latest successful capture of this version for visit linkage.
        PageVisitContentCapture capture = captureRepository.findByContentVersionId(version.getId()).stream()
                .filter(c -> "SUCCESS".equals(c.getStatus()))
                .max(Comparator.comparing(PageVisitContentCapture::getCapturedAt))
                .orElse(null);
        PageVisit visit = capture != null ? pageVisitRepository.findById(capture.getPageVisitId()).orElse(null) : null;

        String sessionId = visit != null ? visit.getSessionId() : null;
        Instant pageVisitedAt = visit != null ? visit.getLastVisited() : null;

        // Search linkage: exact pageVisitId match first, else RESULTS_IN window (10 min).
        String searchId = null;
        List<String> tags = new ArrayList<>();
        if (visit != null) {
            List<SearchQuery> searches = sessionId != null
                    ? searchQueryRepository.findBySessionIdOrderByTimestamp(sessionId)
                    : List.of();
            for (SearchQuery sq : searches) {
                if (sq.getPageVisitId() != null && sq.getPageVisitId().equals(visit.getId())) {
                    searchId = sq.getId();
                    tags.add("SEARCH_LED");
                    break;
                }
            }
            if (searchId == null) {
                for (SearchQuery sq : searches) {
                    if (visit.getFirstVisited() != null && sq.getTimestamp() != null
                            && visit.getFirstVisited().isAfter(sq.getTimestamp())
                            && visit.getFirstVisited().isBefore(sq.getTimestamp().plusSeconds(600))) {
                        searchId = sq.getId();
                        tags.add("RESULTS_IN");
                        break;
                    }
                }
            }
        }
        if (capture != null && capture.getCaptureMethod() != null) {
            tags.add(capture.getCaptureMethod());
        }

        RetrievedResearchContent.Provenance provenance = new RetrievedResearchContent.Provenance(
                doc.getId(), version.getId(),
                visit != null ? visit.getId() : null,
                searchId, sessionId,
                doc.getDomain() != null ? doc.getDomain() : (visit != null ? visit.getDomain() : null),
                doc.getCanonicalUrl(), doc.getSourceUrl(),
                doc.getTitle() != null ? doc.getTitle() : (visit != null ? visit.getTitle() : null),
                pageVisitedAt, version.getExtractedAt(), List.copyOf(tags));

        return new RetrievedResearchContent(chunk.getId(), chunk.getContent(), score,
                provenance, version.getExtractorUsed(), version.getExtractedAt());
    }
}
