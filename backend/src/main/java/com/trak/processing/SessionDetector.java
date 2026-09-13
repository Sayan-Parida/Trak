package com.trak.processing;

import com.trak.domain.repository.ResearchSessionRepository;
import java.time.Instant;
import org.springframework.stereotype.Component;

@Component
public class SessionDetector {

    private final ResearchSessionRepository sessionRepository;

    public SessionDetector(ResearchSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public boolean isValidSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return false;
        }
        return sessionRepository.existsById(sessionId);
    }

    public boolean isValidSessionEvent(String sessionId, Instant timestamp) {
        if (sessionId == null || sessionId.isBlank() || timestamp == null) {
            return false;
        }
        return sessionRepository.findById(sessionId)
                .filter(session -> !timestamp.isBefore(session.getStartTime()))
                .filter(session -> session.getEndTime() == null || !timestamp.isAfter(session.getEndTime()))
                .isPresent();
    }
}
