package com.researchmind.domain.repository;

import com.researchmind.domain.model.ResearchSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResearchSessionRepository extends JpaRepository<ResearchSession, String> {
    List<ResearchSession> findByStatusOrderByStartTimeDesc(String status);
    List<ResearchSession> findByOrderByStartTimeDesc();
}
