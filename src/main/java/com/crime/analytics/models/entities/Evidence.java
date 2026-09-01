package com.crime.analytics.models.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Evidence entity representing investigation evidence
 */
@Entity
@Table(name = "evidence")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Evidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String evidenceNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvidenceType type;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "file_hash")
    private String fileHash;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvidenceStatus status;

    @ManyToOne
    @JoinColumn(name = "case_id", nullable = false)
    private Case case_;

    @Column(columnDefinition = "TEXT")
    private String ocrText;

    @Column(columnDefinition = "TEXT")
    private String analysisResult;

    @Column(name = "relevance_score")
    private Double relevanceScore;

    @Builder.Default
    @OneToMany(mappedBy = "evidence", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ExtractedEntity> extractedEntities = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "collected_by")
    private String collectedBy;

    @Column(name = "collected_date")
    private LocalDateTime collectedDate;

    @Column(name = "chain_of_custody")
    @Lob
    private String chainOfCustody;

    public enum EvidenceType {
        DOCUMENT,
        IMAGE,
        VIDEO,
        AUDIO,
        PHYSICAL,
        DIGITAL,
        WITNESS_STATEMENT,
        FORENSIC,
        OTHER
    }

    public enum EvidenceStatus {
        PENDING_ANALYSIS,
        ANALYZED,
        FLAGGED,
        REJECTED,
        ARCHIVED
    }
}
