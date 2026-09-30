package com.crime.analytics.ai.services;

import org.springframework.stereotype.Service;

import com.crime.analytics.models.entities.Evidence;
import com.crime.analytics.models.entities.ExtractedEntity;
import com.crime.analytics.models.repositories.ExtractedEntityRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for NLP-based entity extraction from text
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EntityExtractorService {

    private final ExtractedEntityRepository extractedEntityRepository;
    private final LlmService llmService;

    /**
     * Extract entities from evidence text
     */
    public Set<ExtractedEntity> extractEntities(Evidence evidence) {
        Set<ExtractedEntity> entities = new HashSet<>();

        if (evidence.getOcrText() == null || evidence.getOcrText().isEmpty()) {
            return entities;
        }

        // Extract different entity types
        entities.addAll(extractPersonEntities(evidence));
        entities.addAll(extractEmailEntities(evidence));
        entities.addAll(extractPhoneEntities(evidence));
        entities.addAll(extractLocationEntities(evidence));
        entities.addAll(extractVehicleEntities(evidence));
        entities.addAll(extractMoneyEntities(evidence));

        return entities;
    }

    /**
     * Extract person names using simple pattern matching
     */
    private Set<ExtractedEntity> extractPersonEntities(Evidence evidence) {
        Set<ExtractedEntity> entities = new HashSet<>();
        // Simple name pattern - can be enhanced with NER models
        Pattern pattern = Pattern.compile("\\b[A-Z][a-z]+ [A-Z][a-z]+\\b");
        Matcher matcher = pattern.matcher(evidence.getOcrText());

        while (matcher.find()) {
            ExtractedEntity entity = ExtractedEntity.builder()
                    .entityText(matcher.group())
                    .type(ExtractedEntity.EntityType.PERSON)
                    .evidence(evidence)
                    .confidenceScore(0.75)
                    .build();
            entities.add(entity);
        }
        return entities;
    }

    /**
     * Extract email addresses
     */
    private Set<ExtractedEntity> extractEmailEntities(Evidence evidence) {
        Set<ExtractedEntity> entities = new HashSet<>();
        Pattern pattern = Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");
        Matcher matcher = pattern.matcher(evidence.getOcrText());

        while (matcher.find()) {
            ExtractedEntity entity = ExtractedEntity.builder()
                    .entityText(matcher.group())
                    .type(ExtractedEntity.EntityType.EMAIL)
                    .evidence(evidence)
                    .confidenceScore(0.95)
                    .build();
            entities.add(entity);
        }
        return entities;
    }

    /**
     * Extract phone numbers
     */
    private Set<ExtractedEntity> extractPhoneEntities(Evidence evidence) {
        Set<ExtractedEntity> entities = new HashSet<>();
        // Phone number patterns
        Pattern pattern = Pattern.compile("\\b(?:\\+?1[-.]?)?\\(?([0-9]{3})\\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\\b");
        Matcher matcher = pattern.matcher(evidence.getOcrText());

        while (matcher.find()) {
            ExtractedEntity entity = ExtractedEntity.builder()
                    .entityText(matcher.group())
                    .type(ExtractedEntity.EntityType.PHONE_NUMBER)
                    .evidence(evidence)
                    .confidenceScore(0.9)
                    .build();
            entities.add(entity);
        }
        return entities;
    }

    /**
     * Extract locations (simplified)
     */
    private Set<ExtractedEntity> extractLocationEntities(Evidence evidence) {
        Set<ExtractedEntity> entities = new HashSet<>();
        // This would benefit from a proper NER model or knowledge base
        Pattern pattern = Pattern.compile("\\b(?:Street|Ave|Road|Blvd|Lane|Drive|Court|Park|Plaza)\\b");
        Matcher matcher = pattern.matcher(evidence.getOcrText());

        while (matcher.find()) {
            ExtractedEntity entity = ExtractedEntity.builder()
                    .entityText(matcher.group())
                    .type(ExtractedEntity.EntityType.LOCATION)
                    .evidence(evidence)
                    .confidenceScore(0.7)
                    .build();
            entities.add(entity);
        }
        return entities;
    }

    /**
     * Extract vehicle information
     */
    private Set<ExtractedEntity> extractVehicleEntities(Evidence evidence) {
        Set<ExtractedEntity> entities = new HashSet<>();
        // Vehicle pattern - license plates and VINs
        Pattern pattern = Pattern.compile("\\b[A-Z]{2,3}[0-9]{3,4}[A-Z]{2}\\b");
        Matcher matcher = pattern.matcher(evidence.getOcrText());

        while (matcher.find()) {
            ExtractedEntity entity = ExtractedEntity.builder()
                    .entityText(matcher.group())
                    .type(ExtractedEntity.EntityType.VEHICLE)
                    .evidence(evidence)
                    .confidenceScore(0.8)
                    .build();
            entities.add(entity);
        }
        return entities;
    }

    /**
     * Extract money amounts
     */
    private Set<ExtractedEntity> extractMoneyEntities(Evidence evidence) {
        Set<ExtractedEntity> entities = new HashSet<>();
        Pattern pattern = Pattern.compile("\\$[0-9]{1,3}(?:,?[0-9]{3})*(?:\\.[0-9]{2})?\\b");
        Matcher matcher = pattern.matcher(evidence.getOcrText());

        while (matcher.find()) {
            ExtractedEntity entity = ExtractedEntity.builder()
                    .entityText(matcher.group())
                    .type(ExtractedEntity.EntityType.MONEY)
                    .evidence(evidence)
                    .confidenceScore(0.92)
                    .build();
            entities.add(entity);
        }
        return entities;
    }
}
