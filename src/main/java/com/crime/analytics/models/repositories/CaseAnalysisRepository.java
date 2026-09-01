package com.crime.analytics.models.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.crime.analytics.models.entities.CaseAnalysis;

import java.util.List;

/**
 * Repository for CaseAnalysis entity
 */
@Repository
public interface CaseAnalysisRepository extends JpaRepository<CaseAnalysis, Long> {
    @Query("SELECT ca FROM CaseAnalysis ca WHERE ca.case_.id = :caseId")
    List<CaseAnalysis> findByCase_Id(@Param("caseId") Long caseId);
    
    @Query("SELECT ca FROM CaseAnalysis ca WHERE ca.case_.id = :caseId")
    Page<CaseAnalysis> findByCase_Id(@Param("caseId") Long caseId, Pageable pageable);
    
    List<CaseAnalysis> findByType(CaseAnalysis.AnalysisType type);
    
    List<CaseAnalysis> findByStatus(CaseAnalysis.AnalysisStatus status);
    
    @Query("SELECT ca FROM CaseAnalysis ca WHERE ca.case_.id = :caseId AND ca.type = :type")
    List<CaseAnalysis> findByCaseIdAndType(@Param("caseId") Long caseId, 
                                          @Param("type") CaseAnalysis.AnalysisType type);
    
    @Query("SELECT ca FROM CaseAnalysis ca WHERE ca.confidenceScore >= :minScore ORDER BY ca.confidenceScore DESC")
    List<CaseAnalysis> findByMinConfidenceScore(@Param("minScore") Double minScore);
}
