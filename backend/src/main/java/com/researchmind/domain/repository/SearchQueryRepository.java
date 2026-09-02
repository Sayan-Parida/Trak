package com.researchmind.domain.repository;

import com.researchmind.domain.model.SearchQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchQueryRepository extends JpaRepository<SearchQuery, String> {
    List<SearchQuery> findBySessionIdOrderByTimestamp(String sessionId);
    List<SearchQuery> findBySessionId(String sessionId);
}
