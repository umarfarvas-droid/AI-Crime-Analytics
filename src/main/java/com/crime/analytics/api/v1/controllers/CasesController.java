package com.crime.analytics.api.v1.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.crime.analytics.api.v1.dto.*;
import com.crime.analytics.models.entities.*;
import com.crime.analytics.models.repositories.*;
import com.crime.analytics.ai.services.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.RandomAccessFile;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.crime.analytics.ai.services.video.VideoJob;

/**
 * REST Controller for case management & AI investigation operations
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
public class CasesController {

    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final EvidenceRepository evidenceRepository;
    private final DocumentRepository documentRepository;
    private final ReportRepository reportRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final SuspectRankerService suspectRankerService;
    private final AiPipelineService aiPipelineService;
    private final ChatInvestigatorService chatInvestigatorService;
    private final ReportGeneratorService reportGeneratorService;
    private final FileStorageService fileStorageService;
    private final com.crime.analytics.ai.services.video.VideoReconstructionService videoReconstructionService;

    @GetMapping
    public ResponseEntity<Page<CaseDto>> getAllCases(Pageable pageable) {
        Page<Case> cases = caseRepository.findAll(pageable);
        return ResponseEntity.ok(cases.map(this::convertToDto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseDto> getCaseById(@PathVariable Long id) {
        return caseRepository.findById(id)
                .map(caseEntity -> ResponseEntity.ok(convertToDto(caseEntity)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CaseDto> createCase(@Valid @RequestBody CaseCreateRequest request, 
                                              Authentication authentication) {
        try {
            User createdBy = (authentication != null && authentication.getName() != null)
                    ? userRepository.findByEmail(authentication.getName()).orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null))
                    : userRepository.findAll().stream().findFirst().orElse(null);

            Case newCase = Case.builder()
                    .caseNumber(request.getCaseNumber())
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .status(Case.CaseStatus.OPEN)
                    .type(request.getType())
                    .incidentDate(request.getIncidentDate())
                    .locationName(request.getLocationName())
                    .createdBy(createdBy)
                    .priority(request.getPriority() != null ? request.getPriority() : Case.PriorityLevel.MEDIUM)
                    .build();

            Case savedCase = caseRepository.save(newCase);
            activityLogRepository.save(ActivityLog.builder()
                    .case_(savedCase)
                    .user(createdBy)
                    .action("case_created")
                    .details("Case " + request.getCaseNumber() + " created")
                    .build());

            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(savedCase));

        } catch (Exception e) {
            log.error("Error creating case", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CaseDto> updateCase(@PathVariable Long id, 
                                              @Valid @RequestBody CaseDto updateRequest) {
        return caseRepository.findById(id)
                .map(caseEntity -> {
                    caseEntity.setTitle(updateRequest.getTitle());
                    caseEntity.setDescription(updateRequest.getDescription());
                    caseEntity.setStatus(updateRequest.getStatus());
                    caseEntity.setType(updateRequest.getType());
                    caseEntity.setPriority(updateRequest.getPriority());
                    caseEntity.setLocationName(updateRequest.getLocationName());
                    
                    Case updatedCase = caseRepository.save(caseEntity);
                    return ResponseEntity.ok(convertToDto(updatedCase));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCase(@PathVariable Long id) {
        if (caseRepository.existsById(id)) {
            caseRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<CaseDto>> searchCases(@RequestParam String keyword, Pageable pageable) {
        Page<Case> cases = caseRepository.searchByTitleOrDescription(keyword, pageable);
        return ResponseEntity.ok(cases.map(this::convertToDto));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<Page<CaseDto>> getCasesByStatus(@PathVariable Case.CaseStatus status, Pageable pageable) {
        Page<Case> cases = caseRepository.findByStatus(status, pageable);
        return ResponseEntity.ok(cases.map(this::convertToDto));
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<Page<CaseDto>> getCasesByPriority(@PathVariable Case.PriorityLevel priority, Pageable pageable) {
        Page<Case> cases = caseRepository.findByPriority(priority, pageable);
        return ResponseEntity.ok(cases.map(this::convertToDto));
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<?> analyzeCase(@PathVariable Long id, Authentication authentication) {
        return caseRepository.findById(id)
                .map(c -> {
                    log.info("[CASE ISOLATION AUDIT] caseId: {}, caseTitle: '{}', incidentCategory: {}, location: '{}', incidentDate: {}, narrativeLength: {}",
                            c.getId(), c.getTitle(), c.getType(), c.getLocationName(), c.getIncidentDate(), c.getDescription() != null ? c.getDescription().length() : 0);
                    Map<String, Object> analysis = aiPipelineService.analyzeCase(c);
                    c.setStatus(Case.CaseStatus.UNDER_INVESTIGATION);
                    c.setConfidenceScore(Double.parseDouble(analysis.get("solvability_score").toString()));
                    caseRepository.save(c);

                    // Prepare or retrieve video reconstruction job metadata
                    var videoJob = videoReconstructionService.getVideoForCase(c.getId());
                    if (videoJob == null) {
                        var plan = videoReconstructionService.getScenePlanForCase(c);
                        videoJob = VideoJob.builder()
                                .caseId(c.getId())
                                .caseNumber(c.getCaseNumber())
                                .status(VideoJob.JobStatus.IDLE)
                                .generationStage("IDLE")
                                .sceneCount(plan.size())
                                .scenePlan(plan)
                                .disclaimer("AI-generated investigative visualization based on the submitted FIR and extracted case data. It is a simulation and does not constitute actual evidence or proof of guilt.")
                                .build();
                    }

                    User user = authentication != null ? userRepository.findByEmail(authentication.getName()).orElse(null) : null;
                    if (user != null) {
                        notificationRepository.save(Notification.builder()
                                .user(user)
                                .title("Analysis Complete")
                                .message("AI analysis and crime scene video reconstruction started for case " + c.getCaseNumber())
                                .notificationType("prediction_updated")
                                .case_(c)
                                .build());
                    }

                    Map<String, Object> resp = new HashMap<>();
                    resp.put("case", convertToDto(c));
                    resp.put("analysis", analysis);
                    resp.put("videoJob", videoJob);
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<?> uploadDocument(@PathVariable Long id, @RequestParam("file") MultipartFile file, Authentication authentication) {
        return caseRepository.findById(id)
                .map(c -> {
                    var stored = fileStorageService.saveFile(id, file);
                    User user = authentication != null ? userRepository.findByEmail(authentication.getName()).orElse(null) : null;

                    Document doc = documentRepository.save(Document.builder()
                            .case_(c)
                            .filename(stored.originalName())
                            .filePath(stored.filePath())
                            .fileType(stored.fileType())
                            .fileSize(stored.fileSize())
                            .extractedText(stored.extractedText())
                            .ocrConfidence(stored.ocrConfidence())
                            .uploadedBy(user)
                            .build());

                    Map<String, Object> resp = new HashMap<>();
                    resp.put("document_id", doc.getId());
                    resp.put("extracted_text_preview", stored.extractedText().length() > 500 ? stored.extractedText().substring(0, 500) : stored.extractedText());
                    resp.put("ocr_confidence", stored.ocrConfidence());
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/chat")
    public ResponseEntity<ChatResponse> chatWithCase(@PathVariable String id, @Valid @RequestBody ChatRequest chatRequest) {
        Optional<Case> cOpt = Optional.empty();
        try {
            Long numericId = Long.parseLong(id);
            cOpt = caseRepository.findById(numericId);
        } catch (NumberFormatException ignored) {}

        if (cOpt.isEmpty()) {
            cOpt = caseRepository.findFirstByCaseNumberOrderByIdDesc(id);
        }

        return cOpt
                .map(c -> {
                    var result = chatInvestigatorService.processChat(c, chatRequest.getQuery(), chatRequest.getConversationId());
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chatGeneral(@Valid @RequestBody ChatRequest chatRequest) {
        String targetCaseId = chatRequest.getCaseId();
        if (targetCaseId == null || targetCaseId.isBlank()) {
            return ResponseEntity.badRequest().body(ChatResponse.builder()
                    .response("Error: Missing 'caseId' parameter for case-scoped RAG query.")
                    .answerType("ERROR")
                    .sources(List.of())
                    .disclaimer("Investigative support only.")
                    .build());
        }

        Optional<Case> cOpt = Optional.empty();
        try {
            Long numericId = Long.parseLong(targetCaseId);
            cOpt = caseRepository.findById(numericId);
        } catch (NumberFormatException ignored) {}

        if (cOpt.isEmpty()) {
            cOpt = caseRepository.findFirstByCaseNumberOrderByIdDesc(targetCaseId);
        }

        return cOpt.map(c -> {
            var result = chatInvestigatorService.processChat(c, chatRequest.getQuery(), chatRequest.getConversationId());
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.status(404).body(ChatResponse.builder()
                .response("Error: Case with ID/Number '" + targetCaseId + "' not found.")
                .answerType("NOT_FOUND")
                .sources(List.of())
                .disclaimer("Investigative support only.")
                .build()));
    }

    @PostMapping("/{id}/chat/reset")
    public ResponseEntity<?> resetChatMemory(@PathVariable Long id) {
        chatInvestigatorService.resetMemory(id);
        return ResponseEntity.ok(Map.of("message", "Reset conversation memory for case " + id));
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<?> generateReport(@PathVariable Long id, Authentication authentication) {
        return caseRepository.findById(id)
                .map(c -> {
                    String investigatorName = authentication != null ? authentication.getName() : "Lead Investigator";
                    String pdfPath = reportGeneratorService.generatePdfReport(c, investigatorName);

                    User user = authentication != null ? userRepository.findByEmail(authentication.getName()).orElse(null) : null;
                    Report report = reportRepository.save(Report.builder()
                            .case_(c)
                            .title("Investigation Report - " + c.getCaseNumber())
                            .pdfPath(pdfPath)
                            .createdBy(user)
                            .build());

                    Map<String, Object> resp = new HashMap<>();
                    resp.put("report_id", report.getId());
                    resp.put("pdf_path", pdfPath);
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/evidence")
    public ResponseEntity<?> addEvidence(@PathVariable Long id, @Valid @RequestBody EvidenceCreateRequest req) {
        return caseRepository.findById(id)
                .map(c -> {
                    Evidence ev = evidenceRepository.save(Evidence.builder()
                            .case_(c)
                            .evidenceNumber("EV-" + System.currentTimeMillis())
                            .title(req.getTitle())
                            .description(req.getDescription())
                            .type(req.getType() != null ? req.getType() : Evidence.EvidenceType.DOCUMENT)
                            .status(Evidence.EvidenceStatus.PENDING_ANALYSIS)
                            .filePath(req.getFilePath())
                            .ocrText(req.getOcrText())
                            .collectedBy(req.getCollectedBy())
                            .build());
                    return ResponseEntity.status(HttpStatus.CREATED).body(ev);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/suspects/ranked")
    public ResponseEntity<?> getRankedSuspects(@PathVariable Long id) {
        return caseRepository.findById(id)
                .map(caseEntity -> {
                    var rankedSuspects = suspectRankerService.rankSuspects(caseEntity, 
                            new java.util.ArrayList<>(caseEntity.getSuspects()));
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("caseId", id);
                    response.put("suspectCount", rankedSuspects.size());
                    response.put("suspects", rankedSuspects);
                    
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(value = {"/{id}/video/generate", "/{id}/reconstruction"})
    public ResponseEntity<?> generateVideoReconstruction(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body != null && body.containsKey("caseId")) {
            String bodyCaseId = body.get("caseId").toString();
            if (!bodyCaseId.equals(id.toString())) {
                Optional<Case> cCheck = caseRepository.findFirstByCaseNumberOrderByIdDesc(bodyCaseId);
                if (cCheck.isEmpty() || !cCheck.get().getId().equals(id)) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Case ID mismatch between path (" + id + ") and payload (" + bodyCaseId + ")"
                    ));
                }
            }
        }

        return caseRepository.findById(id)
                .map(c -> {
                    var job = videoReconstructionService.generateVideoForCase(c);
                    return ResponseEntity.ok(job);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/reconstruction")
    public ResponseEntity<?> generateReconstructionGeneral(@RequestBody Map<String, Object> body) {
        if (body == null || !body.containsKey("caseId")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing 'caseId' parameter."));
        }
        String targetCaseId = body.get("caseId").toString();
        Optional<Case> cOpt = Optional.empty();
        try {
            Long numId = Long.parseLong(targetCaseId);
            cOpt = caseRepository.findById(numId);
        } catch (NumberFormatException ignored) {}

        if (cOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Case '" + targetCaseId + "' not found."));
        }
        Case c = cOpt.get();
        VideoJob job = videoReconstructionService.generateVideoForCase(c);
        return ResponseEntity.ok(job);
    }

    @GetMapping(value = {"/{id}/video", "/{id}/reconstruction"})
    public ResponseEntity<?> getVideoReconstruction(@PathVariable Long id) {
        VideoJob job = videoReconstructionService.getVideoForCase(id);
        if (job == null) {
            Optional<Case> cOpt = caseRepository.findById(id);
            if (cOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Case c = cOpt.get();
            var plan = videoReconstructionService.getScenePlanForCase(c);
            VideoJob idleJob = VideoJob.builder()
                    .caseId(c.getId())
                    .caseNumber(c.getCaseNumber())
                    .status(VideoJob.JobStatus.IDLE)
                    .generationStage("IDLE")
                    .sceneCount(plan.size())
                    .scenePlan(plan)
                    .disclaimer("AI-generated investigative visualization based on the submitted FIR and extracted case data. It is a simulation and does not constitute actual evidence or proof of guilt.")
                    .build();
            return ResponseEntity.ok(idleJob);
        }
        return ResponseEntity.ok(job);
    }

    @GetMapping("/{id}/reconstruction/plan")
    public ResponseEntity<?> getReconstructionScenePlan(@PathVariable Long id) {
        return caseRepository.findById(id)
                .map(c -> ResponseEntity.ok(Map.of(
                        "caseId", c.getCaseNumber(),
                        "sceneCount", videoReconstructionService.getScenePlanForCase(c).size(),
                        "scenes", videoReconstructionService.getScenePlanForCase(c)
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/video/status")
    public ResponseEntity<?> getVideoStatus(@PathVariable Long id, @RequestParam(required = false) String jobId) {
        if (jobId != null && !jobId.isBlank()) {
            return ResponseEntity.ok(videoReconstructionService.getJobStatus(jobId));
        }
        var job = videoReconstructionService.getVideoForCase(id);
        if (job == null) {
            return ResponseEntity.ok(Map.of("status", "NOT_STARTED", "message", "No video reconstruction started for this case."));
        }
        return ResponseEntity.ok(job);
    }

    @GetMapping(value = {
            "/{id}/reconstruction/{jobId}/video",
            "/{id}/reconstruction/video",
            "/{id}/video/stream",
            "/{id}/video/file"
    })
    public ResponseEntity<?> streamReconstructionVideo(
            @PathVariable Long id,
            @PathVariable(required = false) String jobId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {

        Optional<Case> cOpt = caseRepository.findById(id);
        if (cOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        File videoFile = null;
        VideoJob job = videoReconstructionService.getVideoForCase(id);
        if (job != null && job.getVideoFilePath() != null) {
            File f = new File(job.getVideoFilePath());
            if (f.exists() && f.length() > 0) {
                videoFile = f;
            }
        }

        // Fallback search in media directories
        if (videoFile == null) {
            videoFile = findCaseVideoFile(id, jobId);
        }

        if (videoFile == null || !videoFile.exists() || videoFile.length() == 0) {
            log.warn("No video media file found for Case ID {}", id);
            return ResponseEntity.notFound().build();
        }

        long fileLength = videoFile.length();
        MediaType mediaType = MediaType.parseMediaType("video/mp4");

        log.debug("Serving video media for Case {}: {} (Size: {} bytes, Range: {})",
                id, videoFile.getName(), fileLength, rangeHeader);

        // Handle HTTP Range Request for HTML5 Seekable Video Streaming
        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            try {
                String rangeSpec = rangeHeader.substring(6).trim();
                long start = 0;
                long end = fileLength - 1;

                if (rangeSpec.contains("-")) {
                    String[] parts = rangeSpec.split("-", 2);
                    if (!parts[0].isEmpty()) {
                        start = Long.parseLong(parts[0]);
                    }
                    if (parts.length > 1 && !parts[1].isEmpty()) {
                        end = Long.parseLong(parts[1]);
                    }
                }

                if (start > end || start >= fileLength) {
                    return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                            .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength)
                            .build();
                }

                end = Math.min(end, fileLength - 1);
                long rangeLength = end - start + 1;

                byte[] data = new byte[(int) rangeLength];
                try (RandomAccessFile raf = new RandomAccessFile(videoFile, "r")) {
                    raf.seek(start);
                    raf.readFully(data);
                }

                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .contentType(mediaType)
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .header(HttpHeaders.CONTENT_RANGE, String.format("bytes %d-%d/%d", start, end, fileLength))
                        .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(rangeLength))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"case_" + id + "_reconstruction.mp4\"")
                        .body(new ByteArrayResource(data));
            } catch (Exception e) {
                log.error("Error processing range request for case video {}", id, e);
            }
        }

        // Full content response (200 OK)
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileLength))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"case_" + id + "_reconstruction.mp4\"")
                .body(new FileSystemResource(videoFile));
    }

    private File findCaseVideoFile(Long caseId, String jobId) {
        String[] dirs = {"./data/media/reconstructions", "./data/videos"};
        for (String d : dirs) {
            File dir = new File(d);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles((dir1, name) -> {
                    if (!name.endsWith(".mp4") && !name.endsWith(".webm")) return false;
                    if (jobId != null && name.contains(jobId)) return true;
                    return name.startsWith("case_" + caseId + "_") || name.startsWith("video_case_" + caseId + "_");
                });
                if (files != null && files.length > 0) {
                    Arrays.sort(files, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
                    return files[0];
                }
            }
        }
        return null;
    }

    private CaseDto convertToDto(Case caseEntity) {
        return CaseDto.builder()
                .id(caseEntity.getId())
                .caseNumber(caseEntity.getCaseNumber())
                .title(caseEntity.getTitle())
                .description(caseEntity.getDescription())
                .status(caseEntity.getStatus())
                .type(caseEntity.getType())
                .priority(caseEntity.getPriority())
                .incidentDate(caseEntity.getIncidentDate())
                .locationName(caseEntity.getLocationName())
                .confidenceScore(caseEntity.getConfidenceScore())
                .createdAt(caseEntity.getCreatedAt())
                .updatedAt(caseEntity.getUpdatedAt())
                .build();
    }
}
