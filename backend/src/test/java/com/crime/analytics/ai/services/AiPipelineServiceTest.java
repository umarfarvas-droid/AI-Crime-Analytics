package com.crime.analytics.ai.services;

import com.crime.analytics.models.entities.Case;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AiPipelineServiceTest {

    @Autowired
    private AiPipelineService aiPipelineService;

    @Test
    void testAnalyzeCaseHomicide() {
        Case c = Case.builder()
                .caseNumber("FIR-2026-99")
                .title("Homicide Investigation")
                .description("A body was found near the river bank. Suspicious person John Doe was seen leaving at 2:00 AM with a weapon. Contact email officer@police.gov or call 555-123-4567.")
                .type(Case.CaseType.HOMICIDE)
                .build();

        Map<String, Object> analysis = aiPipelineService.analyzeCase(c);

        assertNotNull(analysis);
        assertTrue(analysis.get("crime_category").toString().contains("Homicide"));
        assertTrue(Double.parseDouble(analysis.get("solvability_score").toString()) > 0);
        assertNotNull(analysis.get("extracted_entities"));
        assertNotNull(analysis.get("suspect_rankings"));
    }
}
