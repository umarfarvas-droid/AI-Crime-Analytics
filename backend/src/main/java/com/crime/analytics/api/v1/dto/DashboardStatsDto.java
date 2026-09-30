package com.crime.analytics.api.v1.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {

    @JsonProperty("total_cases")
    private long totalCases;

    @JsonProperty("open_cases")
    private long openCases;

    @JsonProperty("closed_cases")
    private long closedCases;

    @JsonProperty("high_priority_cases")
    private long highPriorityCases;

    @JsonProperty("pending_evidence")
    private long pendingEvidence;

    @JsonProperty("todays_investigations")
    private long todaysInvestigations;

    @JsonProperty("crime_categories")
    private Map<String, Long> crimeCategories;

    @JsonProperty("ai_prediction_accuracy")
    private double aiPredictionAccuracy;

    @JsonProperty("avg_solvability_score")
    private double avgSolvabilityScore;

    public long getTotal_cases() {
        return totalCases;
    }

    public long getOpen_cases() {
        return openCases;
    }

    public long getClosed_cases() {
        return closedCases;
    }

    public long getHigh_priority_cases() {
        return highPriorityCases;
    }

    public long getPending_evidence() {
        return pendingEvidence;
    }

    public long getTodays_investigations() {
        return todaysInvestigations;
    }

    public Map<String, Long> getCrime_categories() {
        return crimeCategories;
    }

    public double getAi_prediction_accuracy() {
        return aiPredictionAccuracy;
    }

    public double getAvg_solvability_score() {
        return avgSolvabilityScore;
    }
}
