package com.crime.analytics.models.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * ExtractedEntity entity representing NLP-extracted entities from evidence
 */
@Entity
@Table(name = "extracted_entities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ExtractedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String entityText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntityType type;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @ManyToOne
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @Column(name = "context_snippet")
    @Lob
    private String contextSnippet;

    @Column(name = "occurrence_count")
    private Integer occurrenceCount;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum EntityType {
        PERSON,
        VICTIM,
        SUSPECT,
        PERSON_OF_INTEREST,
        WITNESS,
        COMPLAINANT,
        INVESTIGATING_OFFICER,
        ORGANIZATION,
        LOCATION,
        JOB_TITLE,
        EVIDENCE,
        DATE,
        TIME,
        MOTIVE,
        PHONE_NUMBER,
        EMAIL,
        URL,
        MONEY,
        VEHICLE,
        WEAPON,
        OTHER
    }
}
