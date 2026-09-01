package com.crime.analytics.ai.services;

import org.springframework.stereotype.Service;

import com.crime.analytics.models.entities.Evidence;
import com.crime.analytics.models.entities.CaseAnalysis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

/**
 * Service for analyzing evidence
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EvidenceAnalyzerService {

    private final LlmService llmService;
    private final EntityExtractorService entityExtractorService;

    /**
     * Analyze evidence and generate analysis result
     */
    public String analyzeEvidence(Evidence evidence) {
        log.info("Analyzing evidence: {}", evidence.getId());

        // Extract entities from evidence
        var entities = entityExtractorService.extractEntities(evidence);
        
        // Generate analysis prompt
        StringBuilder analysisPrompt = new StringBuilder();
        analysisPrompt.append("Analyze the following evidence:\n");
        analysisPrompt.append("Title: ").append(evidence.getTitle()).append("\n");
        analysisPrompt.append("Description: ").append(evidence.getDescription()).append("\n");
        analysisPrompt.append("Type: ").append(evidence.getType()).append("\n");
        
        if (evidence.getOcrText() != null && !evidence.getOcrText().isEmpty()) {
            analysisPrompt.append("Text Content:\n").append(evidence.getOcrText()).append("\n");
        }
        
        if (!entities.isEmpty()) {
            analysisPrompt.append("Extracted Entities:\n");
            entities.forEach(e -> analysisPrompt.append("- ").append(e.getEntityText()).append(" (").append(e.getType()).append(")\n"));
        }
        
        analysisPrompt.append("\nProvide a detailed analysis including relevance, key findings, and recommendations.");

        return llmService.generateCompletion(analysisPrompt.toString());
    }

    /**
     * Calculate relevance score for evidence
     */
    public Double calculateRelevanceScore(Evidence evidence, String caseContext) {
        // Simple scoring logic - can be enhanced with ML models
        double score = 0.0;

        // Base score based on evidence type
        switch (evidence.getType()) {
            case FORENSIC -> score += 0.4;
            case DOCUMENT -> score += 0.3;
            case IMAGE -> score += 0.25;
            case VIDEO -> score += 0.35;
            case WITNESS_STATEMENT -> score += 0.3;
            default -> score += 0.2;
        }

        // Additional points for extracted entities
        if (evidence.getExtractedEntities() != null && !evidence.getExtractedEntities().isEmpty()) {
            score += Math.min(0.3, evidence.getExtractedEntities().size() * 0.05);
        }

        // Normalization to 0-1 range
        return Math.min(score, 1.0);
    }

    /**
     * Flag suspicious evidence
     */
    public boolean isSuspiciousEvidence(Evidence evidence) {
        if (evidence.getOcrText() == null) {
            return false;
        }

        // Check for suspicious keywords
        String lowerText = evidence.getOcrText().toLowerCase();
        return lowerText.contains("weapon") || 
               lowerText.contains("threat") || 
               lowerText.contains("violence") ||
               lowerText.contains("drug") ||
               lowerText.contains("stolen");
    }
}
