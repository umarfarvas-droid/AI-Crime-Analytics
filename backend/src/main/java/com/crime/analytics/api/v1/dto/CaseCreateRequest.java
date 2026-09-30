package com.crime.analytics.api.v1.dto;

import com.crime.analytics.models.entities.Case;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Case creation request DTO supporting both Python FastAPI fields (snake_case)
 * and Java/benchmark fields (camelCase).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseCreateRequest {

    @JsonProperty("case_id")
    private String case_id;

    private String caseNumber;

    @JsonProperty("fir_number")
    private String fir_number;

    @JsonProperty("police_station")
    private String police_station;

    @JsonProperty("crime_category")
    private String crime_category;

    private String title;

    @JsonProperty("crime_description")
    private String crime_description;

    private String description;

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

    public String getCaseNumber() {
        if (caseNumber != null && !caseNumber.isBlank()) return caseNumber;
        if (case_id != null && !case_id.isBlank()) return case_id;
        if (fir_number != null && !fir_number.isBlank()) return fir_number;
        return "CASE-" + System.currentTimeMillis();
    }

    public String getTitle() {
        if (title != null && !title.isBlank()) return title;
        if (crime_category != null && !crime_category.isBlank()) return crime_category;
        if (caseNumber != null && !caseNumber.isBlank()) return "Investigation " + caseNumber;
        if (case_id != null && !case_id.isBlank()) return "Investigation " + case_id;
        return "New Crime Case";
    }

    public String getDescription() {
        if (description != null && !description.isBlank()) return description;
        if (crime_description != null && !crime_description.isBlank()) return crime_description;
        return "";
    }

    public Case.CaseType getType() {
        if (type != null) return type;
        if (crime_category != null) {
            String norm = crime_category.trim().toUpperCase().replace(" ", "_");
            for (Case.CaseType ct : Case.CaseType.values()) {
                if (ct.name().equals(norm) || norm.contains(ct.name())) {
                    return ct;
                }
            }
        }
        return Case.CaseType.OTHER;
    }

    public String getLocationName() {
        if (locationName != null && !locationName.isBlank()) return locationName;
        if (location != null && !location.isBlank()) return location;
        return "Unknown Location";
    }

    public LocalDate getIncidentDate() {
        if (incidentDate != null) return incidentDate;
        if (incident_date != null && !incident_date.isBlank()) {
            try {
                return LocalDate.parse(incident_date.split("T")[0]);
            } catch (Exception ignored) {}
        }
        return LocalDate.now();
    }
}
