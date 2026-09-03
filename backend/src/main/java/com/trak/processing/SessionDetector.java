package com.trak.processing;

import com.trak.domain.repository.ResearchSessionRepository;
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
}
