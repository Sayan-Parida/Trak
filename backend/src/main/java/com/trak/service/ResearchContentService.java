package com.trak.service;

import com.trak.api.dto.ContentIngestRequest;
import com.trak.api.dto.ContentIngestResponse;
import com.trak.api.dto.ContentStatusResponse;
import com.trak.content.CapturePolicyService;
import com.trak.content.ContentNormalizer;
import com.trak.content.ExtractedContent;
import com.trak.content.PageContentExtractor;
import com.trak.content.chunking.ChunkDraft;
import com.trak.content.chunking.ResearchContentChunker;
import com.trak.content.embedding.EmbeddingProvider;
import com.trak.content.embedding.EmbeddingResult;
import com.trak.content.vector.VectorMath;
import com.trak.content.vector.VectorStore;
import com.trak.domain.model.ContentChunk;
import com.trak.domain.model.ContentDocument;
import com.trak.domain.model.ContentVersion;
import com.trak.domain.model.PageVisit;
import com.trak.domain.model.PageVisitContentCapture;
import com.trak.domain.model.ResearchContentEmbedding;
import com.trak.domain.repository.ContentChunkRepository;
import com.trak.domain.repository.ContentDocumentRepository;
import com.trak.domain.repository.ContentVersionRepository;
import com.trak.domain.repository.PageVisitContentCaptureRepository;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.ResearchContentEmbeddingRepository;
import com.trak.exception.ResourceNotFoundException;
import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * M5 content ingestion: privacy-gated acquisition -> canonical extraction ->
 * normalization -> versioning -> semantic chunking -> embedding -> indexing.
 * Raw research trajectory (M1-M4) is never modified; content enriches it.
 */
@Service
public class ResearchContentService {

    private final PageContentExtractor extractor;
    private final ContentNormalizer normalizer;
    private final ResearchContentChunker chunker;
    private final EmbeddingProvider embeddingProvider;
    private final VectorStore vectorStore;
    private final CapturePolicyService capturePolicy;
    private final ContentDocumentRepository documentRepository;
    private final ContentVersionRepository versionRepository;
    private final ContentChunkRepository chunkRepository;
    private final ResearchContentEmbeddingRepository embeddingRepository;
    private final PageVisitContentCaptureRepository captureRepository;
    private final PageVisitRepository pageVisitRepository;
    private final int maxContentLength;

    public ResearchContentService(
            PageContentExtractor extractor,
            ContentNormalizer normalizer,
            ResearchContentChunker chunker,
            EmbeddingProvider embeddingProvider,
            VectorStore vectorStore,
            CapturePolicyService capturePolicy,
            ContentDocumentRepository documentRepository,
            ContentVersionRepository versionRepository,
            ContentChunkRepository chunkRepository,
            ResearchContentEmbeddingRepository embeddingRepository,
            PageVisitContentCaptureRepository captureRepository,
            PageVisitRepository pageVisitRepository,
            @Value("${tkr.content.extraction.max-content-length:100000}") int maxContentLength) {
        this.extractor = extractor;
        this.normalizer = normalizer;
        this.chunker = chunker;
        this.embeddingProvider = embeddingProvider;
        this.vectorStore = vectorStore;
        this.capturePolicy = capturePolicy;
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.chunkRepository = chunkRepository;
        this.embeddingRepository = embeddingRepository;
        this.captureRepository = captureRepository;
        this.pageVisitRepository = pageVisitRepository;
        this.maxContentLength = Math.max(1000, maxContentLength);
    }

    @Transactional
    public ContentIngestResponse ingest(ContentIngestRequest request) {
        Instant now = Instant.now();
        String method = request.effectiveCaptureMethod();
        boolean incognito = request.effectiveIsIncognito();

        CapturePolicyService.Decision decision =
                capturePolicy.decide(request.url(), request.dwellTimeSeconds(), incognito, method);
        if (decision != CapturePolicyService.Decision.ALLOW) {
            return new ContentIngestResponse(null, null, null, "SKIPPED", null,
                    0, 0, 0, now, null, "capture denied: " + decision.name());
        }

        PageVisit visit = resolveVisit(request);
        ExtractedContent extracted = extractor.extract(request.url(), request.html(), now);
        if (extracted.status() != ExtractedContent.ExtractionStatus.SUCCESS) {
            Long captureId = recordFailedCapture(visit, request, extracted, now, method);
            return new ContentIngestResponse(null, null, null, extracted.status().name(), null,
                    0, 0, 0, now, captureId, extracted.errorInfo());
        }

        String mainText = extracted.mainText();
        if (mainText.length() > maxContentLength) {
            mainText = mainText.substring(0, maxContentLength);
        }
        String hash = normalizer.computeContentHash(mainText);
        String canonical = extracted.canonicalUrl() != null ? extracted.canonicalUrl() : request.url();
        String title = extracted.title() != null ? extracted.title()
                : (request.title() != null ? request.title() : (visit != null ? visit.getTitle() : null));
        String domain = extractDomain(canonical);

        ContentDocument document = documentRepository.findByCanonicalUrl(canonical).orElse(null);
        if (document == null) {
            document = new ContentDocument();
            document.setCanonicalUrl(canonical);
            document.setSourceUrl(extracted.sourceUrl());
            document.setTitle(title);
            document.setDomain(domain);
            document.setExtractionStatus("NOT_EXTRACTED");
            document = documentRepository.save(document);
        } else {
            if (title != null && !title.isBlank()) document.setTitle(title);
            if (domain != null) document.setDomain(domain);
        }

        Optional<ContentVersion> latestOpt = versionRepository.findFirstByContentDocumentIdOrderByVersionDesc(document.getId());
        ContentVersion version;
        boolean reused;
        List<ChunkDraft> drafts;
        if (latestOpt.isPresent() && hash.equals(latestOpt.get().getContentHash())) {
            version = latestOpt.get();
            reused = true;
            drafts = List.of();
        } else {
            int nextVersion = latestOpt.map(v -> v.getVersion() + 1).orElse(1);
            version = new ContentVersion();
            version.setContentDocumentId(document.getId());
            version.setVersion(nextVersion);
            version.setContentHash(hash);
            version.setMainText(mainText);
            version.setExtractorUsed(extractor.name());
            version.setExtractedAt(now);
            version = versionRepository.save(version);

            ExtractedContent versioned = new ExtractedContent(canonical, extracted.sourceUrl(), title,
                    mainText, extracted.headings(), extracted.metadata(), hash, now,
                    ExtractedContent.ExtractionStatus.SUCCESS, null);
            drafts = chunker.chunk(versioned);
            List<ContentChunk> chunks = persistChunks(version.getId(), drafts);
            embedChunks(chunks);
            reused = false;
        }

        document.setContentHash(hash);
        document.setExtractionStatus("EXTRACTED");
        document.setLastExtractedAt(now);
        document.setCaptureCount(document.getCaptureCount() + 1);
        document = documentRepository.save(document);

        Long captureId = upsertCapture(visit, document.getId(), version.getId(), now, method,
                request.dwellTimeSeconds(), "SUCCESS", null);

        List<ContentChunk> chunks = chunkRepository.findByContentVersionIdOrderByChunkIndex(version.getId());
        int embedded = (int) embeddingRepository.findByContentChunkIdIn(chunkIds(chunks)).stream()
                .filter(e -> "SUCCESS".equals(e.getStatus())).count();
        int failed = chunks.size() - embedded;

        return new ContentIngestResponse(document.getId(), version.getId(), version.getVersion(),
                reused ? "REUSED" : "EXTRACTED", hash, chunks.size(), embedded, failed,
                now, captureId, reused ? "content unchanged; linked existing version" : "extracted");
    }

    @Transactional(readOnly = true)
    public ContentStatusResponse statusForVisit(String pageVisitId) {
        Optional<PageVisitContentCapture> cap = captureRepository.findByPageVisitId(pageVisitId);
        if (cap.isEmpty()) {
            return new ContentStatusResponse(pageVisitId, null, null, "NOT_EXTRACTED", 0, 0, null);
        }
        PageVisitContentCapture capture = cap.get();
        List<ContentChunk> chunks = capture.getContentVersionId() == null ? List.of()
                : chunkRepository.findByContentVersionIdOrderByChunkIndex(capture.getContentVersionId());
        int embedded = (int) embeddingRepository.findByContentChunkIdIn(chunkIds(chunks)).stream()
                .filter(e -> "SUCCESS".equals(e.getStatus())).count();
        ContentDocument doc = documentRepository.findById(capture.getContentDocumentId()).orElse(null);
        return new ContentStatusResponse(pageVisitId, capture.getContentDocumentId(),
                capture.getContentVersionId(), capture.getStatus(), chunks.size(), embedded,
                doc != null ? doc.getLastExtractedAt() : capture.getCapturedAt());
    }

    // ---- internals ----

    private PageVisit resolveVisit(ContentIngestRequest request) {
        if (request.pageVisitId() != null && !request.pageVisitId().isBlank()) {
            return pageVisitRepository.findById(request.pageVisitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Page visit not found"));
        }
        if (request.sessionId() != null && !request.sessionId().isBlank()
                && request.url() != null && !request.url().isBlank()) {
            return pageVisitRepository.findByUrlAndSessionId(request.url(), request.sessionId()).orElse(null);
        }
        return null;
    }

    private Long recordFailedCapture(PageVisit visit, ContentIngestRequest request,
                                     ExtractedContent extracted, Instant now, String method) {
        if (visit == null) return null;
        Optional<PageVisitContentCapture> existing = captureRepository.findByPageVisitId(visit.getId());
        PageVisitContentCapture capture = existing.orElseGet(PageVisitContentCapture::new);
        String canonical = extracted.canonicalUrl() != null ? extracted.canonicalUrl() : request.url();
        ContentDocument document = documentRepository.findByCanonicalUrl(canonical).orElse(null);
        if (document == null) {
            document = new ContentDocument();
            document.setCanonicalUrl(canonical);
            document.setSourceUrl(request.url());
            document.setTitle(request.title() != null ? request.title() : visit.getTitle());
            document.setDomain(visit.getDomain());
            document.setExtractionStatus("FAILED");
            document = documentRepository.save(document);
        } else {
            document.setExtractionStatus("FAILED");
            documentRepository.save(document);
        }
        capture.setPageVisitId(visit.getId());
        capture.setContentDocumentId(document.getId());
        capture.setContentVersionId(null);
        capture.setCapturedAt(now);
        capture.setCaptureMethod(method);
        capture.setStatus("FAILED");
        capture.setDwellTimeSeconds(request.dwellTimeSeconds());
        capture.setErrorInfo(extracted.errorInfo());
        return captureRepository.save(capture).getId();
    }

    private List<ContentChunk> persistChunks(String versionId, List<ChunkDraft> drafts) {
        List<ContentChunk> out = new ArrayList<>();
        for (ChunkDraft draft : drafts) {
            ContentChunk chunk = new ContentChunk();
            chunk.setContentVersionId(versionId);
            chunk.setChunkIndex(draft.chunkIndex());
            chunk.setSectionPath(draft.sectionPath());
            chunk.setContent(draft.content());
            chunk.setContentHash(draft.contentHash());
            chunk.setStartOffset(draft.startOffset());
            chunk.setEndOffset(draft.endOffset());
            out.add(chunkRepository.save(chunk));
        }
        return out;
    }

    private void embedChunks(List<ContentChunk> chunks) {
        if (chunks.isEmpty()) return;
        List<String> texts = chunks.stream().map(ContentChunk::getContent).toList();
        List<EmbeddingResult> results = embeddingProvider.embedAll(texts);
        for (int i = 0; i < chunks.size(); i++) {
            ContentChunk chunk = chunks.get(i);
            EmbeddingResult result = i < results.size() ? results.get(i)
                    : EmbeddingResult.failure(EmbeddingResult.EmbeddingStatus.EMBEDDING_FAILED,
                    "MISSING", "no embedding result");
            ResearchContentEmbedding emb = embeddingRepository.findByContentChunkId(chunk.getId())
                    .orElseGet(() -> {
                        ResearchContentEmbedding e = new ResearchContentEmbedding();
                        e.setContentChunkId(chunk.getId());
                        return e;
                    });
            emb.setModelName(embeddingProvider.model());
            emb.setModelVersion(embeddingProvider.name());
            if (result.success() && result.vector() != null) {
                emb.setVectorText(VectorMath.format(result.vector()));
                emb.setDimension(result.vector().length);
                emb.setStatus("SUCCESS");
                emb.setErrorCode(null);
                emb.setErrorMessage(null);
                emb = embeddingRepository.save(emb);
                vectorStore.upsert(chunk.getId(), result.vector(),
                        Map.of("model", embeddingProvider.model()));
            } else {
                emb.setDimension(embeddingProvider.dimension() > 0 ? embeddingProvider.dimension() : 0);
                emb.setStatus(switch (result.status()) {
                    case PROVIDER_UNAVAILABLE -> "PROVIDER_UNAVAILABLE";
                    case RATE_LIMITED -> "RATE_LIMITED";
                    case TIMEOUT -> "TIMEOUT";
                    case INPUT_INVALID -> "INPUT_INVALID";
                    default -> "FAILED";
                });
                emb.setErrorCode(result.errorCode());
                emb.setErrorMessage(result.errorMessage());
                embeddingRepository.save(emb);
            }
        }
    }

    private Long upsertCapture(PageVisit visit, String documentId, String versionId, Instant now,
                               String method, Long dwellSeconds, String status, String errorInfo) {
        if (visit == null) return null;
        PageVisitContentCapture capture = captureRepository.findByPageVisitId(visit.getId())
                .orElseGet(PageVisitContentCapture::new);
        capture.setPageVisitId(visit.getId());
        capture.setContentDocumentId(documentId);
        capture.setContentVersionId(versionId);
        capture.setCapturedAt(now);
        capture.setCaptureMethod(method);
        capture.setStatus(status);
        capture.setDwellTimeSeconds(dwellSeconds);
        capture.setErrorInfo(errorInfo);
        return captureRepository.save(capture).getId();
    }

    private List<String> chunkIds(List<ContentChunk> chunks) {
        List<String> ids = new ArrayList<>(chunks.size());
        for (ContentChunk c : chunks) ids.add(c.getId());
        return ids;
    }

    private String extractDomain(String url) {
        if (url == null) return null;
        try {
            return new URI(url).getHost();
        } catch (Exception e) {
            return null;
        }
    }
}
