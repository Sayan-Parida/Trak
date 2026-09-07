package com.trak.domain.repository;

import com.trak.domain.model.PageVisitContentCapture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PageVisitContentCaptureRepository extends JpaRepository<PageVisitContentCapture, Long> {
    Optional<PageVisitContentCapture> findByPageVisitId(String pageVisitId);
    List<PageVisitContentCapture> findByContentDocumentId(String contentDocumentId);
    List<PageVisitContentCapture> findByContentVersionId(String contentVersionId);
}
