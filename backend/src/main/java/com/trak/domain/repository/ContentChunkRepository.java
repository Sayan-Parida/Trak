package com.trak.domain.repository;

import com.trak.domain.model.ContentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentChunkRepository extends JpaRepository<ContentChunk, String> {
    List<ContentChunk> findByContentVersionIdOrderByChunkIndex(String contentVersionId);
    List<ContentChunk> findByContentVersionIdInOrderByChunkIndex(List<String> versionIds);
}
