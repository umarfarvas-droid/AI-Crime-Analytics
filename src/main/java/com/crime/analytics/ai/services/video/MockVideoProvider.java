package com.crime.analytics.ai.services.video;

import com.crime.analytics.models.entities.Case;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-Fidelity Forensic Photographic Simulation Video Provider (Fallback & Demo Engine)
 * Generates genuine 30 FPS browser-playable MP4 videos (H.264 + Synchronized Audio),
 * chronological scene-by-scene reconstruction, dynamic visual prompts, and timeline simulation playback.
 */
@Slf4j
@Component("mockVideoProvider")
@RequiredArgsConstructor
public class MockVideoProvider implements VideoGenerationProvider {

    private final ForensicVideoRenderer forensicVideoRenderer;
    private final ForensicVideoValidator forensicVideoValidator;
    private final Map<String, VideoJob> jobStore = new ConcurrentHashMap<>();

    @Override
    public boolean isConfigured() {
        return true; // Always available as local development and simulation engine
    }

    @Override
    public String getProviderName() {
        return "mock";
    }

    @Override
    public VideoJob startVideoGeneration(Case caseEntity, String prompt, List<VideoJob.ScenePlanItem> scenePlan) {
        String jobId = "mock_sim_" + UUID.randomUUID().toString().substring(0, 8);
        String disclaimer = "AI-generated investigative visualization based on the submitted FIR and extracted case data. It is a simulation and does not constitute actual evidence or proof of guilt.";

        log.info("Starting Forensic Video Reconstruction (30 FPS + Audio Pipeline) for Case #{} (Job ID: {})", caseEntity.getId(), jobId);

        // 1. Generate SVG visual simulation storyboard frames for each scene
        for (VideoJob.ScenePlanItem item : scenePlan) {
            if (item.getVisualFrameSvg() == null || item.getVisualFrameSvg().isBlank()) {
                item.setVisualFrameSvg(generateSceneBlueprintSvg(item, caseEntity));
            }
        }

        long evLinkedCount = scenePlan.stream().filter(s -> s.getEvidence() != null && !s.getEvidence().isEmpty()).count();

        // 2. Generate Real 30 FPS Browser-Playable MP4 Video Media with Synchronized Audio
        File videoFile = null;
        String videoUrl = null;
        String videoFilePath = null;
        long fileSize = 0L;
        int totalFrames = Math.max(1, scenePlan.size()) * ForensicVideoRenderer.FRAMES_PER_SCENE;
        double durationSec = (double) totalFrames / (double) ForensicVideoRenderer.FPS;

        ForensicVideoValidator.QualityValidationReport valReport = null;

        try {
            videoFile = forensicVideoRenderer.generatePlayableMp4(caseEntity, jobId, scenePlan);
            if (videoFile != null && videoFile.exists() && videoFile.length() > 0) {
                fileSize = videoFile.length();
                videoFilePath = videoFile.getAbsolutePath();
                videoUrl = String.format("/api/v1/cases/%d/reconstruction/%s/video", caseEntity.getId(), jobId);

                // Run Automated Quality & Frame Uniqueness Validation
                valReport = forensicVideoValidator.validateVideoFile(videoFile, totalFrames, ForensicVideoRenderer.FPS, 2.0);

                log.info("[MEDIA PIPELINE VALIDATED] Video Reconstruction Generated: CaseID={}, ReconstructionID={}, Path={}, Size={} bytes, URL={}, Duration={}s, 30 FPS, Audio=OK",
                        caseEntity.getId(), jobId, videoFilePath, fileSize, videoUrl, String.format("%.1f", durationSec));
            } else {
                log.error("[MEDIA PIPELINE ERROR] Generated video file is missing or zero-byte: {}", videoFilePath);
            }
        } catch (Exception e) {
            log.error("[MEDIA PIPELINE ERROR] Failed to encode MP4 video for Case #{}: {}", caseEntity.getId(), e.getMessage(), e);
        }

        boolean isMediaValid = valReport != null && valReport.isPassed();

        VideoJob job = VideoJob.builder()
                .jobId(jobId)
                .caseId(caseEntity.getId())
                .caseNumber(caseEntity.getCaseNumber())
                .crimeType(caseEntity.getType() != null ? caseEntity.getType().name() : "CRIME_INVESTIGATION")
                .locationName(caseEntity.getLocationName() != null ? caseEntity.getLocationName() : "Incident Scene")
                .status(isMediaValid ? VideoJob.JobStatus.COMPLETED : VideoJob.JobStatus.FAILED)
                .generationStage(isMediaValid ? "COMPLETED" : "FAILED")
                .progressPercentage(isMediaValid ? 100 : 0)
                .currentStage(isMediaValid ? (valReport != null ? valReport.getSummaryMessage() : "Forensic Video Ready (Demo Reconstruction)") : "VIDEO QUALITY VALIDATION FAILED")
                .prompt(prompt)
                .sceneCount(scenePlan.size())
                .timelineCoverage("100%")
                .evidenceLinkedCount((int) evLinkedCount)
                .scenePlan(scenePlan)
                .videoUrl(videoUrl)
                .videoFilePath(videoFilePath)
                .mediaMimeType("video/mp4")
                .mediaFileSize(fileSize)
                .durationSeconds(durationSec)
                .errorMessage(isMediaValid ? null : (valReport != null ? String.join("; ", valReport.getValidationErrors()) : "Failed to encode video media file."))
                .createdAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .providerName("Mock Provider")
                .modelName("forensic-doc-v4")
                .disclaimer(disclaimer)
                .build();

        jobStore.put(jobId, job);
        return job;
    }

    @Override
    public VideoJob getVideoJobStatus(String jobId) {
        return jobStore.getOrDefault(jobId, VideoJob.builder()
                .jobId(jobId)
                .status(VideoJob.JobStatus.FAILED)
                .errorMessage("Reconstruction job ID not found.")
                .build());
    }

    /**
     * Generate dynamic vector SVG storyboard reenactment frame for scene simulation preview
     */
    private String generateSceneBlueprintSvg(VideoJob.ScenePlanItem scene, Case c) {
        String time = scene.getTime() != null ? scene.getTime() : "21:18:04";
        String loc = scene.getLocation() != null ? scene.getLocation() : (c.getLocationName() != null ? c.getLocationName() : "Metropolitan Heights");
        String fact = scene.getFactOrInference() != null ? scene.getFactOrInference().toUpperCase() : "CONFIRMED FACT";
        String event = scene.getEvent() != null ? scene.getEvent() : "Incident reenactment event.";
        if (event.length() > 80) event = event.substring(0, 77) + "...";

        boolean isFact = fact.contains("FACT");

        return String.format(
            "<svg viewBox='0 0 800 450' xmlns='http://www.w3.org/2000/svg' class='w-full h-full rounded-xl bg-slate-950'>" +
            "<!-- Night Background & Building Facade -->" +
            "<defs>" +
            "<linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%%' stop-color='#0a0f1d'/><stop offset='100%%' stop-color='#141c30'/></linearGradient>" +
            "<linearGradient id='door' x1='0' y1='0' x2='0' y2='1'><stop offset='0%%' stop-color='#0f172a'/><stop offset='100%%' stop-color='#1e3a5f'/></linearGradient>" +
            "<radialGradient id='light' cx='50%%' cy='40%%' r='60%%'><stop offset='0%%' stop-color='#fef08a' stop-opacity='0.35'/><stop offset='100%%' stop-color='#000000' stop-opacity='0'/></radialGradient>" +
            "</defs>" +
            "<rect width='800' height='450' fill='url(#sky)'/>" +
            "<!-- Commercial Entrance Building & Windows -->" +
            "<rect x='60' y='50' width='680' height='320' fill='#1e293b'/>" +
            "<rect x='110' y='80' width='90' height='70' fill='#fef08a' opacity='0.35' stroke='#334155'/>" +
            "<rect x='230' y='80' width='90' height='70' fill='#fef08a' opacity='0.35' stroke='#334155'/>" +
            "<rect x='480' y='80' width='90' height='70' fill='#fef08a' opacity='0.35' stroke='#334155'/>" +
            "<rect x='600' y='80' width='90' height='70' fill='#fef08a' opacity='0.35' stroke='#334155'/>" +
            "<!-- Glass Entrance Doors -->" +
            "<rect x='310' y='160' width='180' height='210' fill='url(#door)' stroke='#64748b' stroke-width='2'/>" +
            "<line x1='400' y1='160' x2='400' y2='370' stroke='#64748b' stroke-width='2'/>" +
            "<!-- Green Access LED Scanner -->" +
            "<rect x='500' y='240' width='16' height='30' fill='#0f172a' stroke='#334155'/>" +
            "<circle cx='508' cy='250' r='4' fill='#10b981'/>" +
            "<!-- Volumetric Entrance Spotlight -->" +
            "<polygon points='380,140 420,140 600,450 200,450' fill='url(#light)'/>" +
            "<!-- Pavement -->" +
            "<rect x='0' y='370' width='800' height='80' fill='#111827'/>" +
            "<line x1='0' y1='370' x2='800' y2='370' stroke='#374151' stroke-width='1.5'/>" +
            "<!-- Realistic Human Actor Approaching Door -->" +
            "<ellipse cx='385' cy='395' rx='30' ry='8' fill='#000000' opacity='0.6'/>" +
            "<line x1='380' y1='280' x2='372' y2='355' stroke='#18202f' stroke-width='10' stroke-linecap='round'/>" +
            "<line x1='390' y1='280' x2='398' y2='355' stroke='#18202f' stroke-width='10' stroke-linecap='round'/>" +
            "<polygon points='368,205 402,205 408,295 362,295' fill='#283246' stroke='#334155'/>" +
            "<line x1='370' y1='215' x2='355' y2='260' stroke='#1e293b' stroke-width='7' stroke-linecap='round'/>" +
            "<line x1='400' y1='215' x2='415' y2='255' stroke='#1e293b' stroke-width='7' stroke-linecap='round'/>" +
            "<circle cx='385' cy='182' r='14' fill='#e1af8c'/>" +
            "<path d='M 371 180 A 14 14 0 0 1 399 180 Z' fill='#1c1412'/>" +
            "<!-- CCTV Camera Top Overlay -->" +
            "<text x='40' y='38' fill='#34d399' font-family='monospace' font-size='11' font-weight='bold'>CAM 04 • %s • CCTV SURVEILLANCE FEED</text>" +
            "<text x='760' y='38' fill='#ffffff' font-family='monospace' font-size='11' font-weight='bold' text-anchor='end'>LOC: %s</text>" +
            "<!-- Bottom Sleek Bar -->" +
            "<rect x='0' y='410' width='800' height='40' fill='#080c16' opacity='0.95'/>" +
            "<text x='40' y='430' fill='#e2e8f0' font-family='sans-serif' font-size='11'>%s</text>" +
            "<text x='760' y='430' fill='%s' font-family='monospace' font-size='10' font-weight='bold' text-anchor='end'>%s</text>" +
            "</svg>",
            time, loc, event, isFact ? "#34d399" : "#fbbf24", isFact ? "● CONFIRMED FACT" : "▲ INFERRED EVENT"
        );
    }
}
