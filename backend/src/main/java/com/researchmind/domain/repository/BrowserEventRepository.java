package com.researchmind.domain.repository;

import com.researchmind.domain.model.BrowserEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BrowserEventRepository extends JpaRepository<BrowserEvent, Long> {
    List<BrowserEvent> findBySessionIdOrderByTimestamp(String sessionId);
    Optional<BrowserEvent> findByTabIdAndUrlAndTimestamp(int tabId, String url, Instant timestamp);
    List<BrowserEvent> findByProcessedFalse();
    List<BrowserEvent> findBySessionId(String sessionId);
}
