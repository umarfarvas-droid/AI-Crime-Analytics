package com.crime.analytics.models.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Suspect entity representing suspects in crime cases
 */
@Entity
@Table(name = "suspects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Suspect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuspectStatus status;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "email_address")
    private String emailAddress;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "last_known_location")
    private String lastKnownLocation;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "criminal_history")
    @Lob
    private String criminalHistory;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "risk_level")
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    @ManyToOne
    @JoinColumn(name = "case_id", nullable = false)
    private Case case_;

    @Column(name = "motive_confidence")
    private Double motiveConfidence;

    @Column(name = "opportunity_confidence")
    private Double opportunityConfidence;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public enum SuspectStatus {
        PERSON_OF_INTEREST,
        SUSPECT,
        WANTED,
        ARRESTED,
        CLEARED,
        DECEASED
    }

    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}
