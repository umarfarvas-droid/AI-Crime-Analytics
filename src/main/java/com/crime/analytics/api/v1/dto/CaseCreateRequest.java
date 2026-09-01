package com.crime.analytics.api.v1.dto;

import com.crime.analytics.models.entities.Case;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Case creation request DTO with Swagger example schemas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseCreateRequest {
    
    @Schema(description = "Unique case identification number", example = "CASE-2026-0042")
    @NotBlank(message = "Case number is required")
    private String caseNumber;
    
    @Schema(description = "Title of the crime case investigation", example = "Central Bank Vault Heist")
    @NotBlank(message = "Title is required")
    private String title;
    
    @Schema(description = "Detailed crime narrative description", example = "Two armed suspects entered the main vault at 09:15 AM wearing dark hoodies. Getaway sedan license plate XYZ-987.")
    private String description;
    
    @Schema(description = "Classification type of crime", example = "THEFT")
    @NotNull(message = "Case type is required")
    private Case.CaseType type;
    
    @Schema(description = "Investigation priority level", example = "HIGH")
    private Case.PriorityLevel priority;
    
    @Schema(description = "Date when the incident occurred", example = "2026-08-13")
    private LocalDate incidentDate;
    
    @Schema(description = "Physical location or district", example = "Central Plaza Branch")
    private String locationName;
}
