package com.crime.analytics.models.repositories;

import com.crime.analytics.models.entities.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    @Query("SELECT a FROM ActivityLog a WHERE a.case_.id = :caseId ORDER BY a.createdAt DESC")
    List<ActivityLog> findByCase_IdOrderByCreatedAtDesc(@Param("caseId") Long caseId);

    List<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
