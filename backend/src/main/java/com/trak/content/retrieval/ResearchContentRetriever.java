package com.trak.content.retrieval;

import java.util.List;

/**
 * Research-aware retriever. Answers "given what this user is researching,
 * which previously encountered evidence is relevant?" — never generic
 * semanticSearch(query). Session/trajectory/domain/time context is
 * first-class; vector similarity is one signal among several.
 */
public interface ResearchContentRetriever {

    /** Primary entry point; all context travels in the request object. */
    List<RetrievedResearchContent> retrieve(ResearchRetrievalRequest request);

    /** Recent evidence for a session (temporal continuity, no query needed). */
    List<RetrievedResearchContent> recentForSession(String sessionId, int limit);

    /** Evidence from a specific captured document. */
    List<RetrievedResearchContent> fromDocument(String contentDocumentId, String query, int limit);
}
