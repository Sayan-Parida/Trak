package com.trak.domain.repository;

import com.trak.domain.model.ContentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentVersionRepository extends JpaRepository<ContentVersion, String> {
    List<ContentVersion> findByContentDocumentIdOrderByVersionDesc(String contentDocumentId);
    Optional<ContentVersion> findFirstByContentDocumentIdOrderByVersionDesc(String contentDocumentId);
    Optional<ContentVersion> findByContentDocumentIdAndContentHash(String contentDocumentId, String contentHash);
}
