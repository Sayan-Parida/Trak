package com.trak.domain.repository;

import com.trak.domain.model.ContentDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentDocumentRepository extends JpaRepository<ContentDocument, String> {
    Optional<ContentDocument> findByCanonicalUrl(String canonicalUrl);
    List<ContentDocument> findByDomain(String domain);
    List<ContentDocument> findByExtractionStatus(String status);
}
