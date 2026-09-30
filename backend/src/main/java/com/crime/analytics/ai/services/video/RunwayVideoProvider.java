package com.crime.analytics.ai.services.video;

import com.crime.analytics.core.config.AppProperties;
import com.crime.analytics.models.entities.Case;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RunwayML Video Generation Provider (Gen-3 Alpha / Turbo)
 */
@Slf4j
@Component("runwayVideoProvider")
@RequiredArgsConstructor
public class RunwayVideoProvider implements VideoGenerationProvider {

    private final AppProperties appProperties;
    private final Map<String, VideoJob> jobStore = new ConcurrentHashMap<>();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean isConfigured() {
        String key = getApiKey();
        return key != null && !key.isBlank() && !key.equalsIgnoreCase("none") && !key.equalsIgnoreCase("your-api-key");
    }

    private String getApiKey() {
        String envRunway = System.getenv("RUNWAY_API_KEY");
        if (envRunway != null && !envRunway.isBlank()) return envRunway;
        if (appProperties.getVideo() != null && "runway".equalsIgnoreCase(appProperties.getVideo().getProvider())) {
            return appProperties.getVideo().getApiKey();
        }
        return null;
    }

    @Override
    public String getProviderName() {
        return "runway";
    }

    @Override
    public VideoJob startVideoGeneration(Case caseEntity, String prompt, List<VideoJob.ScenePlanItem> scenePlan) {
        String jobId = "runway_job_" + UUID.randomUUID().toString().substring(0, 8);
        String disclaimer = "AI-generated investigative visualization based on the submitted FIR and extracted case data. It is a simulation and does not constitute actual evidence or proof of guilt.";

        if (!isConfigured()) {
            VideoJob unconf = VideoJob.builder()
                    .jobId(jobId)
                    .caseId(caseEntity.getId())
                    .caseNumber(caseEntity.getCaseNumber())
                    .status(VideoJob.JobStatus.UNCONFIGURED)
                    .currentStage("AI Video Provider Not Configured")
                    .errorMessage("Runway API Key is not configured. Configure RUNWAY_API_KEY environment variable.")
                    .sceneCount(scenePlan.size())
                    .scenePlan(scenePlan)
                    .createdAt(LocalDateTime.now())
                    .providerName("Runway")
                    .modelName("gen3a_turbo")
                    .disclaimer(disclaimer)
                    .build();
            jobStore.put(jobId, unconf);
            return unconf;
        }

        VideoJob job = VideoJob.builder()
                .jobId(jobId)
                .caseId(caseEntity.getId())
                .caseNumber(caseEntity.getCaseNumber())
                .status(VideoJob.JobStatus.IN_PROGRESS)
                .progressPercentage(15)
                .currentStage("Submitting prompt to RunwayML Gen-3 API...")
                .prompt(prompt)
                .sceneCount(scenePlan.size())
                .scenePlan(scenePlan)
                .createdAt(LocalDateTime.now())
                .providerName("Runway")
                .modelName("gen3a_turbo")
                .disclaimer(disclaimer)
                .build();

        jobStore.put(jobId, job);
        new Thread(() -> executeRunwayTask(jobId, caseEntity, prompt)).start();
        return job;
    }

    @Override
    public VideoJob getVideoJobStatus(String jobId) {
        return jobStore.getOrDefault(jobId, VideoJob.builder()
                .jobId(jobId)
                .status(VideoJob.JobStatus.FAILED)
                .errorMessage("Job not found.")
                .build());
    }

    private void executeRunwayTask(String jobId, Case caseEntity, String prompt) {
        VideoJob job = jobStore.get(jobId);
        if (job == null) return;
        try {
            String apiKey = getApiKey();
            Map<String, Object> reqBody = Map.of(
                    "promptText", prompt,
                    "model", "gen3a_turbo",
                    "watermark", false,
                    "duration", 5
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.dev.runwayml.com/v1/tasks"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("X-Runway-Version", "2024-11-06")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(reqBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 || response.statusCode() == 201) {
                Map<String, Object> respMap = objectMapper.readValue(response.body(), Map.class);
                String taskId = (String) respMap.get("id");
                job.setCurrentStage("Rendering scene simulation on RunwayML cluster...");
                job.setProgressPercentage(40);
                jobStore.put(jobId, job);
                pollRunway(jobId, apiKey, taskId);
            } else {
                job.setStatus(VideoJob.JobStatus.FAILED);
                job.setErrorMessage("Runway API Error (" + response.statusCode() + "): " + response.body());
                jobStore.put(jobId, job);
            }
        } catch (Exception e) {
            log.error("Runway generation failure", e);
            job.setStatus(VideoJob.JobStatus.FAILED);
            job.setErrorMessage("Runway Provider Error: " + e.getMessage());
            jobStore.put(jobId, job);
        }
    }

    private void pollRunway(String jobId, String apiKey, String taskId) {
        VideoJob job = jobStore.get(jobId);
        if (job == null) return;
        for (int i = 0; i < 30; i++) {
            try {
                Thread.sleep(4000);
                HttpRequest pollReq = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.dev.runwayml.com/v1/tasks/" + taskId))
                        .header("Authorization", "Bearer " + apiKey)
                        .header("X-Runway-Version", "2024-11-06")
                        .GET()
                        .build();
                HttpResponse<String> pollResp = httpClient.send(pollReq, HttpResponse.BodyHandlers.ofString());
                if (pollResp.statusCode() == 200) {
                    Map<String, Object> pMap = objectMapper.readValue(pollResp.body(), Map.class);
                    String status = (String) pMap.get("status");
                    if ("SUCCEEDED".equalsIgnoreCase(status) || "SUCCESS".equalsIgnoreCase(status)) {
                        Object output = pMap.get("output");
                        String outUrl = output instanceof List<?> l && !l.isEmpty() ? l.get(0).toString() : (output != null ? output.toString() : null);
                        job.setStatus(VideoJob.JobStatus.COMPLETED);
                        job.setVideoUrl(outUrl);
                        job.setProgressPercentage(100);
                        job.setCurrentStage("Video Ready");
                        job.setCompletedAt(LocalDateTime.now());
                        jobStore.put(jobId, job);
                        return;
                    } else if ("FAILED".equalsIgnoreCase(status)) {
                        job.setStatus(VideoJob.JobStatus.FAILED);
                        job.setErrorMessage("Runway rendering failed: " + pMap.get("failure"));
                        jobStore.put(jobId, job);
                        return;
                    }
                }
            } catch (Exception ignored) {}
        }
        job.setStatus(VideoJob.JobStatus.FAILED);
        job.setErrorMessage("Runway rendering timed out.");
        jobStore.put(jobId, job);
    }
}
