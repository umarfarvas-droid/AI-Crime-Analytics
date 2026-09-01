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
 * Replicate AI Video Generation Provider (Luma Ray / Minimax)
 */
@Slf4j
@Component("replicateVideoProvider")
@RequiredArgsConstructor
public class ReplicateVideoProvider implements VideoGenerationProvider {

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
        String envReplicate = System.getenv("REPLICATE_API_KEY");
        if (envReplicate != null && !envReplicate.isBlank()) return envReplicate;
        if (appProperties.getVideo() != null && "replicate".equalsIgnoreCase(appProperties.getVideo().getProvider())) {
            return appProperties.getVideo().getApiKey();
        }
        return null;
    }

    @Override
    public String getProviderName() {
        return "replicate";
    }

    @Override
    public VideoJob startVideoGeneration(Case caseEntity, String prompt, List<VideoJob.ScenePlanItem> scenePlan) {
        String jobId = "replicate_job_" + UUID.randomUUID().toString().substring(0, 8);
        String disclaimer = "AI-generated investigative visualization based on the submitted FIR and extracted case data. It is a simulation and does not constitute actual evidence or proof of guilt.";

        if (!isConfigured()) {
            VideoJob unconf = VideoJob.builder()
                    .jobId(jobId)
                    .caseId(caseEntity.getId())
                    .caseNumber(caseEntity.getCaseNumber())
                    .status(VideoJob.JobStatus.UNCONFIGURED)
                    .currentStage("AI Video Provider Not Configured")
                    .errorMessage("Replicate API Key is not configured. Configure REPLICATE_API_KEY environment variable.")
                    .sceneCount(scenePlan.size())
                    .scenePlan(scenePlan)
                    .createdAt(LocalDateTime.now())
                    .providerName("Replicate")
                    .modelName("luma/ray")
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
                .currentStage("Submitting prompt to Replicate API...")
                .prompt(prompt)
                .sceneCount(scenePlan.size())
                .scenePlan(scenePlan)
                .createdAt(LocalDateTime.now())
                .providerName("Replicate")
                .modelName("luma/ray")
                .disclaimer(disclaimer)
                .build();

        jobStore.put(jobId, job);
        new Thread(() -> executeReplicateTask(jobId, caseEntity, prompt)).start();
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

    private void executeReplicateTask(String jobId, Case caseEntity, String prompt) {
        VideoJob job = jobStore.get(jobId);
        if (job == null) return;
        try {
            String apiKey = getApiKey();
            Map<String, Object> reqBody = Map.of(
                    "version", "luma/ray",
                    "input", Map.of("prompt", prompt, "aspect_ratio", "16:9")
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.replicate.com/v1/predictions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(reqBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 || response.statusCode() == 201) {
                Map<String, Object> respMap = objectMapper.readValue(response.body(), Map.class);
                String predId = (String) respMap.get("id");
                job.setCurrentStage("Rendering scene simulation via Replicate Ray model...");
                job.setProgressPercentage(40);
                jobStore.put(jobId, job);
                pollReplicate(jobId, apiKey, predId);
            } else {
                job.setStatus(VideoJob.JobStatus.FAILED);
                job.setErrorMessage("Replicate API Error (" + response.statusCode() + "): " + response.body());
                jobStore.put(jobId, job);
            }
        } catch (Exception e) {
            log.error("Replicate generation failure", e);
            job.setStatus(VideoJob.JobStatus.FAILED);
            job.setErrorMessage("Replicate Provider Error: " + e.getMessage());
            jobStore.put(jobId, job);
        }
    }

    private void pollReplicate(String jobId, String apiKey, String predId) {
        VideoJob job = jobStore.get(jobId);
        if (job == null) return;
        for (int i = 0; i < 30; i++) {
            try {
                Thread.sleep(3000);
                HttpRequest pollReq = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.replicate.com/v1/predictions/" + predId))
                        .header("Authorization", "Bearer " + apiKey)
                        .GET()
                        .build();
                HttpResponse<String> pollResp = httpClient.send(pollReq, HttpResponse.BodyHandlers.ofString());
                if (pollResp.statusCode() == 200) {
                    Map<String, Object> pMap = objectMapper.readValue(pollResp.body(), Map.class);
                    String status = (String) pMap.get("status");
                    if ("succeeded".equalsIgnoreCase(status)) {
                        Object output = pMap.get("output");
                        String outUrl = output instanceof List<?> l && !l.isEmpty() ? l.get(0).toString() : (output != null ? output.toString() : null);
                        job.setStatus(VideoJob.JobStatus.COMPLETED);
                        job.setVideoUrl(outUrl);
                        job.setProgressPercentage(100);
                        job.setCurrentStage("Video Ready");
                        job.setCompletedAt(LocalDateTime.now());
                        jobStore.put(jobId, job);
                        return;
                    } else if ("failed".equalsIgnoreCase(status)) {
                        job.setStatus(VideoJob.JobStatus.FAILED);
                        job.setErrorMessage("Replicate prediction failed: " + pMap.get("error"));
                        jobStore.put(jobId, job);
                        return;
                    }
                }
            } catch (Exception ignored) {}
        }
        job.setStatus(VideoJob.JobStatus.FAILED);
        job.setErrorMessage("Replicate rendering timed out.");
        jobStore.put(jobId, job);
    }
}
