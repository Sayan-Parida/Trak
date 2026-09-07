package com.trak.domain.repository;

import com.trak.domain.model.ResearchContentEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResearchContentEmbeddingRepository extends JpaRepository<ResearchContentEmbedding, Long> {
    Optional<ResearchContentEmbedding> findByContentChunkId(String contentChunkId);
    List<ResearchContentEmbedding> findByContentChunkIdIn(List<String> chunkIds);
    List<ResearchContentEmbedding> findByStatus(String status);
}
