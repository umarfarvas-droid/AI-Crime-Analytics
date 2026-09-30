package com.crime.analytics.models.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.crime.analytics.models.entities.Evidence;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Evidence entity
 */
@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long> {
    Optional<Evidence> findByEvidenceNumber(String evidenceNumber);
    
    @Query("SELECT e FROM Evidence e WHERE e.case_.id = :caseId")
    Page<Evidence> findByCase_Id(@Param("caseId") Long caseId, Pageable pageable);
    
    @Query("SELECT e FROM Evidence e WHERE e.case_.id = :caseId")
    List<Evidence> findByCase_Id(@Param("caseId") Long caseId);
    
    Page<Evidence> findByType(Evidence.EvidenceType type, Pageable pageable);
    
    Page<Evidence> findByStatus(Evidence.EvidenceStatus status, Pageable pageable);
    
    @Query("SELECT e FROM Evidence e WHERE e.title LIKE %:searchTerm% OR e.description LIKE %:searchTerm%")
    Page<Evidence> searchByTitleOrDescription(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT e FROM Evidence e WHERE e.relevanceScore >= :minScore ORDER BY e.relevanceScore DESC")
    List<Evidence> findByMinRelevanceScore(@Param("minScore") Double minScore);
    
    @Query("SELECT e FROM Evidence e WHERE e.case_.id = :caseId AND e.status = :status")
    List<Evidence> findByCaseIdAndStatus(@Param("caseId") Long caseId, 
                                        @Param("status") Evidence.EvidenceStatus status);
}
