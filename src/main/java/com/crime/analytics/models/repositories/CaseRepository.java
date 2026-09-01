package com.crime.analytics.models.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.crime.analytics.models.entities.Case;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Case entity
 */
@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {
    Optional<Case> findByCaseNumber(String caseNumber);
    Optional<Case> findFirstByCaseNumberOrderByIdDesc(String caseNumber);
    List<Case> findAllByCaseNumber(String caseNumber);
    
    Page<Case> findByStatus(Case.CaseStatus status, Pageable pageable);
    
    Page<Case> findByType(Case.CaseType type, Pageable pageable);
    
    @Query("SELECT c FROM Case c WHERE c.title LIKE %:searchTerm% OR c.description LIKE %:searchTerm%")
    Page<Case> searchByTitleOrDescription(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    Page<Case> findByAssignedToId(Long userId, Pageable pageable);
    
    @Query("SELECT c FROM Case c WHERE c.incidentDate BETWEEN :startDate AND :endDate")
    List<Case> findCasesByDateRange(@Param("startDate") LocalDate startDate, 
                                    @Param("endDate") LocalDate endDate);
    
    Page<Case> findByPriority(Case.PriorityLevel priority, Pageable pageable);
    
    @Query("SELECT c FROM Case c WHERE c.confidenceScore >= :minScore ORDER BY c.confidenceScore DESC")
    List<Case> findByMinConfidenceScore(@Param("minScore") Double minScore);
}
