package com.crime.analytics.models.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.crime.analytics.models.entities.Suspect;

import java.util.List;

/**
 * Repository for Suspect entity
 */
@Repository
public interface SuspectRepository extends JpaRepository<Suspect, Long> {
    @Query("SELECT s FROM Suspect s WHERE s.case_.id = :caseId")
    Page<Suspect> findByCase_Id(@Param("caseId") Long caseId, Pageable pageable);
    
    @Query("SELECT s FROM Suspect s WHERE s.case_.id = :caseId")
    List<Suspect> findByCase_Id(@Param("caseId") Long caseId);
    
    Page<Suspect> findByStatus(Suspect.SuspectStatus status, Pageable pageable);
    
    Page<Suspect> findByRiskLevel(Suspect.RiskLevel riskLevel, Pageable pageable);
    
    @Query("SELECT s FROM Suspect s WHERE s.firstName LIKE %:searchTerm% OR s.lastName LIKE %:searchTerm%")
    Page<Suspect> searchByName(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT s FROM Suspect s WHERE s.case_.id = :caseId ORDER BY s.riskScore DESC")
    List<Suspect> findByCaseIdOrderByRiskScore(@Param("caseId") Long caseId);
    
    @Query("SELECT s FROM Suspect s WHERE s.riskScore >= :minScore ORDER BY s.riskScore DESC")
    List<Suspect> findByMinRiskScore(@Param("minScore") Double minScore);
}
