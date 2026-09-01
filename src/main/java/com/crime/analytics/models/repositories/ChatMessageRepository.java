package com.crime.analytics.models.repositories;

import com.crime.analytics.models.entities.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT c FROM ChatMessage c WHERE c.case_.id = :caseId ORDER BY c.createdAt ASC")
    List<ChatMessage> findByCase_IdOrderByCreatedAtAsc(@Param("caseId") Long caseId);
}
