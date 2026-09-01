package com.crime.analytics.api.v1.controllers;

import com.crime.analytics.ai.services.EvidenceAnalyzerService;
import com.crime.analytics.api.v1.dto.EvidenceCreateRequest;
import com.crime.analytics.models.entities.Case;
import com.crime.analytics.models.entities.Evidence;
import com.crime.analytics.models.repositories.CaseRepository;
import com.crime.analytics.models.repositories.EvidenceRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for Evidence Management and Analysis
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/evidence")
@RequiredArgsConstructor
public class EvidenceController {

    private final EvidenceRepository evidenceRepository;
    private final CaseRepository caseRepository;
    private final EvidenceAnalyzerService evidenceAnalyzerService;

    @GetMapping
    public ResponseEntity<List<Evidence>> getAllEvidence() {
        return ResponseEntity.ok(evidenceRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evidence> getEvidenceById(@PathVariable Long id) {
        return evidenceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<Evidence>> getEvidenceByCase(@PathVariable Long caseId) {
        return ResponseEntity.ok(evidenceRepository.findByCase_Id(caseId));
    }

    @PostMapping
    public ResponseEntity<?> createEvidence(@Valid @RequestBody EvidenceCreateRequest request) {
        Optional<Case> caseOpt = caseRepository.findById(request.getCaseId());
        if (caseOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Case not found with ID: " + request.getCaseId()));
        }
        Evidence evidence = Evidence.builder()
                .case_(caseOpt.get())
                .evidenceNumber("EVD-" + System.currentTimeMillis())
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : Evidence.EvidenceType.DIGITAL)
                .filePath(request.getFilePath())
                .ocrText(request.getOcrText())
                .collectedBy(request.getCollectedBy())
                .status(Evidence.EvidenceStatus.PENDING_ANALYSIS)
                .build();
        Evidence saved = evidenceRepository.save(evidence);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<?> analyzeEvidence(@PathVariable Long id) {
        return evidenceRepository.findById(id)
                .map(evidence -> {
                    String analysis = evidenceAnalyzerService.analyzeEvidence(evidence);
                    double score = evidenceAnalyzerService.calculateRelevanceScore(evidence, "");
                    evidence.setAnalysisResult(analysis);
                    evidence.setRelevanceScore(score);
                    evidence.setStatus(Evidence.EvidenceStatus.ANALYZED);
                    evidenceRepository.save(evidence);

                    Map<String, Object> resp = new HashMap<>();
                    resp.put("evidence_id", id);
                    resp.put("relevance_score", score);
                    resp.put("analysis_result", analysis);
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvidence(@PathVariable Long id) {
        if (evidenceRepository.existsById(id)) {
            evidenceRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
