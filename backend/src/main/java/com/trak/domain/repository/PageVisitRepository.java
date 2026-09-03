package com.trak.domain.repository;

import com.trak.domain.model.PageVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PageVisitRepository extends JpaRepository<PageVisit, String> {
    List<PageVisit> findBySessionIdOrderByFirstVisited(String sessionId);
    Optional<PageVisit> findByUrlAndSessionId(String url, String sessionId);
    List<PageVisit> findBySessionId(String sessionId);
    List<PageVisit> findByNormalizedTitleContainingIgnoreCase(String term);
    List<PageVisit> findByTitleContainingIgnoreCase(String term);
    List<PageVisit> findByNormalizedDomainContainingIgnoreCase(String term);
    List<PageVisit> findByDomainContainingIgnoreCase(String term);
    List<PageVisit> findByUrlContainingIgnoreCase(String term);
    List<PageVisit> findByNormalizedTitleIsNullOrNormalizedTitle(String value);
    List<PageVisit> findByNormalizedDomainIsNullOrNormalizedDomain(String value);
}
