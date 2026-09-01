package com.crime.analytics.api.v1.dto;

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
    private long totalCases;
    private long openCases;
    private long closedCases;
    private long highPriorityCases;
    private long pendingEvidence;
    private long todaysInvestigations;
    private Map<String, Long> crimeCategories;
    private double aiPredictionAccuracy;
    private double avgSolvabilityScore;
}
