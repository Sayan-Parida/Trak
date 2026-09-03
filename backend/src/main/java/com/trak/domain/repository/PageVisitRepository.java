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
}
