package com.crime.analytics.models.repositories;

import com.crime.analytics.models.entities.VideoReconstruction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoReconstructionRepository extends JpaRepository<VideoReconstruction, Long> {
    
    Optional<VideoReconstruction> findFirstByCaseEntity_IdOrderByIdDesc(Long caseId);
    
    Optional<VideoReconstruction> findByJobId(String jobId);
    
    List<VideoReconstruction> findByCaseEntity_Id(Long caseId);
}
