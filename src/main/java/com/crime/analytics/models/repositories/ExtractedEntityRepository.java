package com.crime.analytics.models.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.crime.analytics.models.entities.ExtractedEntity;

import java.util.List;

/**
 * Repository for ExtractedEntity entity
 */
@Repository
public interface ExtractedEntityRepository extends JpaRepository<ExtractedEntity, Long> {
    List<ExtractedEntity> findByEvidence_Id(Long evidenceId);
    
    List<ExtractedEntity> findByType(ExtractedEntity.EntityType type);
    
    @Query("SELECT e FROM ExtractedEntity e WHERE e.confidenceScore >= :minScore ORDER BY e.confidenceScore DESC")
    List<ExtractedEntity> findByMinConfidenceScore(@Param("minScore") Double minScore);
    
    @Query("SELECT e FROM ExtractedEntity e WHERE e.evidence.id = :evidenceId AND e.type = :type")
    List<ExtractedEntity> findByEvidenceIdAndType(@Param("evidenceId") Long evidenceId, 
                                                  @Param("type") ExtractedEntity.EntityType type);
}
