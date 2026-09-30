package com.crime.analytics.ai.services;

import org.springframework.stereotype.Service;

import com.crime.analytics.models.entities.Suspect;
import com.crime.analytics.models.entities.Case;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for ranking suspects based on various factors
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SuspectRankerService {

    private final LlmService llmService;

    /**
     * Rank suspects for a case based on available evidence
     */
    public List<Suspect> rankSuspects(Case caseEntity, List<Suspect> suspects) {
        log.info("Ranking {} suspects for case {}", suspects.size(), caseEntity.getId());

        // Calculate risk score for each suspect
        for (Suspect suspect : suspects) {
            double riskScore = calculateRiskScore(suspect, caseEntity);
            suspect.setRiskScore(riskScore);
            suspect.setRiskLevel(getRiskLevel(riskScore));
        }

        // Sort by risk score in descending order
        return suspects.stream()
                .sorted((s1, s2) -> Double.compare(s2.getRiskScore(), s1.getRiskScore()))
                .collect(Collectors.toList());
    }

    /**
     * Calculate risk score for a suspect
     */
    private Double calculateRiskScore(Suspect suspect, Case caseEntity) {
        double score = 0.0;

        // Factor 1: Risk level (0.3 weight)
        switch (suspect.getStatus()) {
            case ARRESTED -> score += 0.3;
            case WANTED -> score += 0.25;
            case SUSPECT -> score += 0.2;
            case PERSON_OF_INTEREST -> score += 0.1;
            case CLEARED -> score += 0.0;
            case DECEASED -> score += 0.05;
        }

        // Factor 2: Motive confidence (0.25 weight)
        if (suspect.getMotiveConfidence() != null) {
            score += suspect.getMotiveConfidence() * 0.25;
        }

        // Factor 3: Opportunity confidence (0.25 weight)
        if (suspect.getOpportunityConfidence() != null) {
            score += suspect.getOpportunityConfidence() * 0.25;
        }

        // Factor 4: Criminal history (0.2 weight)
        if (suspect.getCriminalHistory() != null && !suspect.getCriminalHistory().isEmpty()) {
            score += 0.15; // Base score for criminal history
            if (suspect.getCriminalHistory().toLowerCase().contains("violent")) {
                score += 0.05; // Additional for violent history
            }
        }

        // Normalization to 0-1 range
        return Math.min(score, 1.0);
    }

    /**
     * Determine risk level based on score
     */
    private Suspect.RiskLevel getRiskLevel(Double score) {
        if (score >= 0.8) return Suspect.RiskLevel.CRITICAL;
        if (score >= 0.6) return Suspect.RiskLevel.HIGH;
        if (score >= 0.4) return Suspect.RiskLevel.MEDIUM;
        return Suspect.RiskLevel.LOW;
    }

    /**
     * Generate suspect profile analysis
     */
    public String generateSuspectAnalysis(Suspect suspect) {
        StringBuilder profilePrompt = new StringBuilder();
        profilePrompt.append("Generate a detailed suspect profile for:\n");
        profilePrompt.append("Name: ").append(suspect.getFullName()).append("\n");
        profilePrompt.append("Status: ").append(suspect.getStatus()).append("\n");
        profilePrompt.append("Risk Level: ").append(suspect.getRiskLevel()).append("\n");
        
        if (suspect.getCriminalHistory() != null) {
            profilePrompt.append("Criminal History: ").append(suspect.getCriminalHistory()).append("\n");
        }
        
        if (suspect.getMotiveConfidence() != null) {
            profilePrompt.append("Motive Confidence: ").append(suspect.getMotiveConfidence()).append("\n");
        }
        
        if (suspect.getOpportunityConfidence() != null) {
            profilePrompt.append("Opportunity Confidence: ").append(suspect.getOpportunityConfidence()).append("\n");
        }
        
        profilePrompt.append("\nProvide a comprehensive analysis and assessment.");

        return llmService.generateCompletion(profilePrompt.toString());
    }
}
