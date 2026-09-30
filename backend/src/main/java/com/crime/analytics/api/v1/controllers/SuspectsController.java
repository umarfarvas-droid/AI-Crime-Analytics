package com.crime.analytics.api.v1.controllers;

import com.crime.analytics.ai.services.SuspectRankerService;
import com.crime.analytics.api.v1.dto.SuspectCreateRequest;
import com.crime.analytics.models.entities.Case;
import com.crime.analytics.models.entities.Suspect;
import com.crime.analytics.models.repositories.CaseRepository;
import com.crime.analytics.models.repositories.SuspectRepository;
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
 * REST Controller for Suspect Management and AI Profile Evaluation
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/suspects")
@RequiredArgsConstructor
public class SuspectsController {

    private final SuspectRepository suspectRepository;
    private final CaseRepository caseRepository;
    private final SuspectRankerService suspectRankerService;

    @GetMapping
    public ResponseEntity<List<Suspect>> getAllSuspects() {
        return ResponseEntity.ok(suspectRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Suspect> getSuspectById(@PathVariable Long id) {
        return suspectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<Suspect>> getSuspectsByCase(@PathVariable Long caseId) {
        return ResponseEntity.ok(suspectRepository.findByCase_Id(caseId));
    }

    @PostMapping
    public ResponseEntity<?> createSuspect(@Valid @RequestBody SuspectCreateRequest request) {
        Optional<Case> caseOpt = caseRepository.findById(request.getCaseId());
        if (caseOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Case not found with ID: " + request.getCaseId()));
        }
        String[] nameParts = request.getFullName().trim().split("\\s+", 2);
        String first = nameParts[0];
        String last = nameParts.length > 1 ? nameParts[1] : "";

        Suspect suspect = Suspect.builder()
                .case_(caseOpt.get())
                .firstName(first)
                .lastName(last)
                .status(request.getStatus() != null ? request.getStatus() : Suspect.SuspectStatus.SUSPECT)
                .notes(request.getNotes() != null ? request.getNotes() : request.getAlibi())
                .riskScore(0.5)
                .riskLevel(Suspect.RiskLevel.MEDIUM)
                .build();
        Suspect saved = suspectRepository.save(suspect);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getSuspectProfile(@PathVariable Long id) {
        return suspectRepository.findById(id)
                .map(suspect -> {
                    String profile = suspectRankerService.generateSuspectAnalysis(suspect);
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("suspect", suspect);
                    resp.put("ai_profile", profile);
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSuspect(@PathVariable Long id) {
        if (suspectRepository.existsById(id)) {
            suspectRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
