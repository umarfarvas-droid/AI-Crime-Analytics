package com.crime.analytics.models.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * CaseAnalysis entity representing AI analysis results for a case
 */
@Entity
@Table(name = "case_analyses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class CaseAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "case_id", nullable = false)
    private Case case_;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnalysisType type;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "LONGTEXT")
    private String detailedAnalysis;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "recommendations")
    @Lob
    private String recommendations;

    @ManyToOne
    @JoinColumn(name = "analyst_id")
    private User analyst;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "analysis_completed_at")
    private LocalDateTime analysisCompletedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnalysisStatus status;

    @Column(name = "model_version")
    private String modelVersion;

    public enum AnalysisType {
        SUSPECT_RANKING,
        EVIDENCE_ANALYSIS,
        PATTERN_DETECTION,
        RELATIONSHIP_GRAPH,
        RISK_ASSESSMENT,
        TIMELINE_ANALYSIS,
        SUMMARY_REPORT
    }

    public enum AnalysisStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED
    }
}
