package com.crime.analytics.api.v1.dto;

import com.crime.analytics.models.entities.Case;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Case Data Transfer Object supporting both Python FastAPI fields (snake_case)
 * and Java/benchmark fields (camelCase).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseDto {

    private Long id;

    @JsonProperty("case_id")
    private String case_id;

    private String caseNumber;

    @JsonProperty("fir_number")
    private String fir_number;

    @JsonProperty("police_station")
    private String police_station;

    @JsonProperty("crime_category")
    private String crime_category;

    @JsonProperty("crime_category_confidence")
    private Double crime_category_confidence;

    private String title;

    @JsonProperty("crime_description")
    private String crime_description;

    private String description;

    private Case.CaseStatus status;
    private Case.CaseType type;
    private Case.PriorityLevel priority;

    @JsonProperty("incident_date")
    private String incident_date;

    private LocalDate incidentDate;

    @JsonProperty("incident_time")
    private String incident_time;

    private String location;
    private String locationName;
    private Double latitude;
    private Double longitude;

    @JsonProperty("solvability_score")
    private Double solvability_score;

    @JsonProperty("investigation_complexity")
    private String investigation_complexity;

    @JsonProperty("extracted_entities")
    private Object extracted_entities;

    @JsonProperty("ai_analysis")
    private Object ai_analysis;

    private Object timeline;

    @JsonProperty("suspect_rankings")
    private Object suspect_rankings;

    private Object recommendations;
    private Object predictions;

    @JsonProperty("relationship_graph")
    private Object relationship_graph;

    @JsonProperty("victim_details")
    private Object victim_details;

    @JsonProperty("suspect_details")
    private Object suspect_details;

    @JsonProperty("witness_details")
    private Object witness_details;

    @JsonProperty("evidence_list")
    private Object evidence_list;

    @JsonProperty("additional_notes")
    private String additional_notes;

    @JsonProperty("assigned_officer_id")
    private Long assigned_officer_id;

    private Double confidenceScore;

    @JsonProperty("created_at")
    private LocalDateTime created_at;

    @JsonProperty("updated_at")
    private LocalDateTime updated_at;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getCase_id() {
        return case_id != null ? case_id : caseNumber;
    }

    public String getCaseNumber() {
        return caseNumber != null ? caseNumber : case_id;
    }

    public String getFir_number() {
        return fir_number != null ? fir_number : (case_id != null ? case_id : caseNumber);
    }

    public String getCrime_description() {
        return crime_description != null ? crime_description : description;
    }

    public String getDescription() {
        return description != null ? description : crime_description;
    }

    public String getLocation() {
        return location != null ? location : locationName;
    }

    public String getLocationName() {
        return locationName != null ? locationName : location;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt != null ? createdAt : created_at;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt != null ? updatedAt : updated_at;
    }
}
