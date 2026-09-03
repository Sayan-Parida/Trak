package com.trak.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ResearchGraphResponse(
        String sessionId,
        List<ResearchGraphNode> nodes,
        List<ResearchGraphEdge> edges
) {
    public record ResearchGraphNode(
            String id,
            String type,
            String label,
            Map<String, Object> metadata
    ) {}

    public record ResearchGraphEdge(
            String source,
            String target,
            String relationshipType,
            double confidence,
            String reason,
            Instant sourceTimestamp,
            Instant targetTimestamp,
            Map<String, Object> metadata
    ) {}
}
