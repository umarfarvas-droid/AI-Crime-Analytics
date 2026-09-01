package com.crime.analytics.models.repositories;

import com.crime.analytics.models.entities.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    @Query("SELECT d FROM Document d WHERE d.case_.id = :caseId")
    List<Document> findByCase_Id(@Param("caseId") Long caseId);
}
