package com.crime.analytics.models.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Case entity representing crime investigation cases
 */
@Entity
@Table(name = "cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String caseNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseType type;

    @Column(name = "incident_date")
    private LocalDate incidentDate;

    @Column(name = "location_name")
    private String locationName;

    @Column(name = "location_latitude")
    private Double locationLatitude;

    @Column(name = "location_longitude")
    private Double locationLongitude;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne
    @JoinColumn(name = "created_by_id", nullable = false, updatable = false)
    private User createdBy;

    @Builder.Default
    @OneToMany(mappedBy = "case_", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Evidence> evidences = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "case_", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Suspect> suspects = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "case_", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CaseAnalysis> analyses = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "priority_level")
    @Enumerated(EnumType.STRING)
    private PriorityLevel priority;

    public enum CaseStatus {
        OPEN,
        UNDER_INVESTIGATION,
        CLOSED,
        SUSPENDED,
        COLD
    }

    public enum CaseType {
        HOMICIDE,
        MURDER,
        KIDNAPPING,
        EXTORTION,
        ROBBERY,
        BURGLARY,
        ASSAULT,
        THEFT,
        FRAUD,
        FINANCIAL_FRAUD,
        CYBER_CRIME,
        CORPORATE_CRIME,
        ORGANIZED_CRIME,
        TRAFFICKING,
        OTHER
    }

    public enum PriorityLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}
