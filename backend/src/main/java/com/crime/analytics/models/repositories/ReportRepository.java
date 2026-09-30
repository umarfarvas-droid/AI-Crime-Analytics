package com.crime.analytics.models.repositories;

import com.crime.analytics.models.entities.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    @Query("SELECT r FROM Report r WHERE r.case_.id = :caseId")
    List<Report> findByCase_Id(@Param("caseId") Long caseId);
}
