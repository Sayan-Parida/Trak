package com.trak.domain.repository;

import com.trak.domain.model.ResearchSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResearchSessionRepository extends JpaRepository<ResearchSession, String> {
    List<ResearchSession> findByStatusOrderByStartTimeDesc(String status);
    List<ResearchSession> findByOrderByStartTimeDesc();
    List<ResearchSession> findByTitleContainingIgnoreCase(String term);
}
