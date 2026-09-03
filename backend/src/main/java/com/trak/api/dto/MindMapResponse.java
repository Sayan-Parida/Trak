package com.trak.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record MindMapResponse(
        String sessionId,
        List<MindMapNode> nodes,
        List<MindMapEdge> edges
) {
    public record MindMapNode(
            String id,
            String type, // SEARCH or PAGE
            String label,
            String url,
            String domain,
            Instant timestamp,
            Map<String, Object> metadata
    ) {}

    public record MindMapEdge(
            String source,
            String target,
            String relationship,
            String description
    ) {}
}
