package com.crime.analytics.api.v1.controllers;

import com.crime.analytics.ai.services.AiPipelineService;
import com.crime.analytics.api.v1.dto.SimulationRequest;
import com.crime.analytics.models.entities.Case;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/simulator")
@RequiredArgsConstructor
public class SimulatorController {

    private final AiPipelineService aiPipelineService;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeSimulation(@Valid @RequestBody SimulationRequest request) {
        log.info("Running FIR text simulation analysis");
        Case tempCase = Case.builder()
                .caseNumber("SIM-" + System.currentTimeMillis())
                .title("Simulated Crime Case")
                .description(request.getDescription())
                .status(Case.CaseStatus.OPEN)
                .type(Case.CaseType.OTHER)
                .build();

        Map<String, Object> analysis = aiPipelineService.analyzeCase(tempCase);
        return ResponseEntity.ok(Map.of("simulation", analysis));
    }
}
