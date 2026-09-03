package com.trak.service;

import com.trak.domain.model.PageVisit;
import com.trak.domain.model.ResearchSession;
import com.trak.domain.model.SearchQuery;
import com.trak.domain.repository.PageVisitRepository;
import com.trak.domain.repository.ResearchSessionRepository;
import com.trak.domain.repository.SearchQueryRepository;
import com.trak.processing.text.ResearchTextNormalizer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ResearchSearchIndexInitializer implements CommandLineRunner {
    private final SearchQueryRepository searchRepository;
    private final PageVisitRepository pageRepository;
    private final ResearchSessionRepository sessionRepository;
    private final ResearchSearchIndexService indexService;

    public ResearchSearchIndexInitializer(SearchQueryRepository searchRepository, PageVisitRepository pageRepository,
                                          ResearchSessionRepository sessionRepository, ResearchSearchIndexService indexService) {
        this.searchRepository = searchRepository;
        this.pageRepository = pageRepository;
        this.sessionRepository = sessionRepository;
        this.indexService = indexService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        boolean canonicalFieldsChanged = false;
        for (SearchQuery search : searchRepository.findByNormalizedQueryIsNullOrNormalizedQuery("")) {
            String normalized = ResearchTextNormalizer.normalize(search.getQueryText());
            if (search.getNormalizedQuery() == null || search.getNormalizedQuery().isBlank()) {
                search.setNormalizedQuery(normalized);
                canonicalFieldsChanged = true;
            }
        }
        for (PageVisit page : pageRepository.findByNormalizedTitleIsNullOrNormalizedTitle("")) {
            String normalizedTitle = ResearchTextNormalizer.normalize(page.getTitle());
            if (page.getNormalizedTitle() == null || page.getNormalizedTitle().isBlank()) {
                page.setNormalizedTitle(normalizedTitle);
                canonicalFieldsChanged = true;
            }
        }
        for (PageVisit page : pageRepository.findByNormalizedDomainIsNullOrNormalizedDomain("")) {
            if (page.getNormalizedDomain() == null || page.getNormalizedDomain().isBlank()) {
                page.setNormalizedDomain(ResearchTextNormalizer.normalize(page.getDomain()));
                canonicalFieldsChanged = true;
            }
        }
        if (canonicalFieldsChanged) {
            searchRepository.flush();
            pageRepository.flush();
        }

        indexService.initialize();
        long expected = searchRepository.count() + pageRepository.count() + sessionRepository.count();
        long indexed = indexService.count();
        if (indexed != expected) {
            rebuild();
        }
    }

    @Transactional
    public int rebuild() {
        return indexService.rebuild(searchRepository.findAll(), pageRepository.findAll(), sessionRepository.findAll());
    }
}
