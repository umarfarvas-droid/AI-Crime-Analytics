package com.crime.analytics.api.v1.dto;

import com.crime.analytics.models.entities.Case;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseUpdateRequest {
    private String title;
    private String description;
    private Case.CaseStatus status;
    private Case.CaseType type;
    private Case.PriorityLevel priority;
    private LocalDate incidentDate;
    private String locationName;
    private String notes;
}
