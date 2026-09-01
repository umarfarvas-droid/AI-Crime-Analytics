package com.crime.analytics.api.v1.dto;

import com.crime.analytics.models.entities.Case;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Case Data Transfer Object
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseDto {
    private Long id;
    private String caseNumber;
    private String title;
    private String description;
    private Case.CaseStatus status;
    private Case.CaseType type;
    private Case.PriorityLevel priority;
    private LocalDate incidentDate;
    private String locationName;
    private Double confidenceScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
