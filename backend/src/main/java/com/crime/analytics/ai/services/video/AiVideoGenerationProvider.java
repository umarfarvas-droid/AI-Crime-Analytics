package com.crime.analytics.ai.services.video;

import com.crime.analytics.core.config.AppProperties;
import com.crime.analytics.models.entities.Case;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise Production Implementation of VideoGenerationProvider supporting
 * Runway API, Replicate API, and Luma AI Video Services with real HTTP async polling,
 * MP4 download & persistent local storage.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiVideoGenerationProvider implements VideoGenerationProvider {

    private final AppProperties appProperties;
    private final Map<String, VideoJob> jobStore = new ConcurrentHashMap<>();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean isConfigured() {
        String apiKey = getApiKey();
        return apiKey != null 
                && !apiKey.isBlank() 
                && !apiKey.equalsIgnoreCase("your-api-key") 
                && !apiKey.equalsIgnoreCase("none")
                && !apiKey.contains("sk-proj-crime-analytics-forensic-sora-v1");
    }

    private String getApiKey() {
        String envRunway = System.getenv("RUNWAY_API_KEY");
        if (envRunway != null && !envRunway.isBlank()) return envRunway;

        String envReplicate = System.getenv("REPLICATE_API_KEY");
        if (envReplicate != null && !envReplicate.isBlank()) return envReplicate;

        String envVideo = System.getenv("AI_VIDEO_API_KEY");
        if (envVideo != null && !envVideo.isBlank()) return envVideo;

        String envOpenAi = System.getenv("OPENAI_API_KEY");
        if (envOpenAi != null && !envOpenAi.isBlank()) return envOpenAi;

        if (appProperties.getVideo() != null && appProperties.getVideo().getApiKey() != null && !appProperties.getVideo().getApiKey().isBlank()) {
            return appProperties.getVideo().getApiKey();
        }
        return System.getProperty("app.video.api-key");
    }

    @Override
    public String getProviderName() {
        String key = getApiKey();
        if (System.getenv("RUNWAY_API_KEY") != null) return "runway";
        if (System.getenv("REPLICATE_API_KEY") != null) return "replicate";
        if (appProperties.getVideo() != null && appProperties.getVideo().getProvider() != null) {
            return appProperties.getVideo().getProvider();
        }
        return "runway";
    }

    @Override
    public VideoJob startVideoGeneration(Case caseEntity, String prompt, List<VideoJob.ScenePlanItem> scenePlan) {
        String jobId = "vid_job_" + UUID.randomUUID().toString().substring(0, 8);
        String disclaimer = "AI-GENERATED CRIME SCENE RECONSTRUCTION — NOT ACTUAL EVIDENCE. INFERRED VISUAL HYPOTHESIS.";

        // Requirement 6: If no API key/provider is configured, return UNCONFIGURED status cleanly
        if (!isConfigured()) {
            log.warn("Video generation requested for Case #{} but AI video provider is not configured.", caseEntity.getId());
            VideoJob unconfiguredJob = VideoJob.builder()
                    .jobId(jobId)
                    .caseId(caseEntity.getId())
                    .caseNumber(caseEntity.getCaseNumber())
                    .status(VideoJob.JobStatus.UNCONFIGURED)
                    .progressPercentage(0)
                    .currentStage("AI Video Provider Not Configured")
                    .prompt(prompt)
                    .scenePlan(scenePlan)
                    .errorMessage("AI video generation is not configured. Configure RUNWAY_API_KEY, REPLICATE_API_KEY, or OPENAI_API_KEY in application.yml or environment variables.")
                    .createdAt(LocalDateTime.now())
                    .providerName(getProviderName())
                    .modelName(appProperties.getVideo() != null ? appProperties.getVideo().getModel() : "gen4.5")
                    .disclaimer(disclaimer)
                    .build();

            jobStore.put(jobId, unconfiguredJob);
            return unconfiguredJob;
        }

        // Configured Mode: Create active asynchronous video generation task
        VideoJob initialJob = VideoJob.builder()
                .jobId(jobId)
                .caseId(caseEntity.getId())
                .caseNumber(caseEntity.getCaseNumber())
                .status(VideoJob.JobStatus.IN_PROGRESS)
                .progressPercentage(10)
                .currentStage("Submitting prompt to " + getProviderName() + " API")
                .prompt(prompt)
                .scenePlan(scenePlan)
                .createdAt(LocalDateTime.now())
                .providerName(getProviderName())
                .modelName(appProperties.getVideo() != null ? appProperties.getVideo().getModel() : "gen4.5")
                .disclaimer(disclaimer)
                .build();

        jobStore.put(jobId, initialJob);

        // Async Background Execution calling Real External Provider API
        new Thread(() -> processRealVideoApi(jobId, caseEntity, prompt)).start();

        return initialJob;
    }

    @Override
    public VideoJob getVideoJobStatus(String jobId) {
        return jobStore.getOrDefault(jobId, VideoJob.builder()
                .jobId(jobId)
                .status(VideoJob.JobStatus.FAILED)
                .errorMessage("Video generation job ID not found.")
                .build());
    }

    private void processRealVideoApi(String jobId, Case caseEntity, String prompt) {
        VideoJob job = jobStore.get(jobId);
        if (job == null) return;

        String apiKey = getApiKey();
        String provider = getProviderName().toLowerCase();

        try {
            updateStage(job, 25, "Transmitting scene prompt to " + provider);

            String remoteVideoUrl = null;
            if (provider.contains("runway")) {
                remoteVideoUrl = callRunwayApi(apiKey, prompt, job);
            } else if (provider.contains("replicate")) {
                remoteVideoUrl = callReplicateApi(apiKey, prompt, job);
            } else {
                remoteVideoUrl = callGenericVideoApi(apiKey, prompt, job);
            }

            if (remoteVideoUrl != null && !remoteVideoUrl.isBlank()) {
                updateStage(job, 85, "Downloading generated MP4 video stream");
                String localVideoPath = downloadAndSaveMp4(remoteVideoUrl, caseEntity.getId(), jobId);

                job.setStatus(VideoJob.JobStatus.COMPLETED);
                job.setProgressPercentage(100);
                job.setCurrentStage("Video Ready");
                job.setVideoUrl("/api/v1/cases/" + caseEntity.getId() + "/video/stream");
                job.setCompletedAt(LocalDateTime.now());
                jobStore.put(jobId, job);

                log.info("Video generation job {} completed successfully. Saved to {}", jobId, localVideoPath);
            } else {
                job.setStatus(VideoJob.JobStatus.FAILED);
                job.setErrorMessage("Provider API returned null output video URL.");
                jobStore.put(jobId, job);
            }

        } catch (Exception e) {
            log.error("Video Generation API Failure for job {}", jobId, e);
            job.setStatus(VideoJob.JobStatus.FAILED);
            job.setErrorMessage("Video Provider Generation Error: " + e.getMessage());
            jobStore.put(jobId, job);
        }
    }

    private String callRunwayApi(String apiKey, String prompt, VideoJob job) throws Exception {
        log.info("Calling RunwayML Video API for job {}", job.getJobId());

        String[] endpoints = new String[] {
            "https://api.dev.runwayml.com/v1/text_to_video",
            "https://api.dev.runwayml.com/v1/image_to_video",
            "https://api.runwayml.com/v1/tasks"
        };

        String lastError = null;
        for (String endpoint : endpoints) {
            try {
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("promptText", prompt);
                requestBody.put("model", "gen3a_turbo");
                requestBody.put("watermark", false);
                requestBody.put("duration", 5);
                if (endpoint.endsWith("/tasks")) {
                    requestBody.put("taskType", "text_to_video");
                }

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Authorization", "Bearer " + apiKey)
                        .header("X-Runway-Version", "2024-11-06")
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 401 || response.statusCode() == 403) {
                    throw new RuntimeException("Video Provider Authentication Failed (HTTP " + response.statusCode() + "): Invalid or unauthorized RUNWAY_API_KEY.");
                } else if (response.statusCode() == 429) {
                    throw new RuntimeException("Video Generation Rate Limited (HTTP 429). Runway quota exceeded.");
                } else if (response.statusCode() == 200 || response.statusCode() == 201 || response.statusCode() == 202) {
                    Map<String, Object> respMap = objectMapper.readValue(response.body(), Map.class);
                    String taskId = (String) respMap.get("id");
                    if (taskId != null) {
                        log.info("Runway API task created successfully with ID: {} on endpoint {}", taskId, endpoint);
                        return pollRunwayTask(apiKey, taskId, job);
                    }
                } else {
                    lastError = "HTTP " + response.statusCode() + " from " + endpoint + ": " + response.body();
                    log.warn("Runway endpoint {} returned error: {}", endpoint, lastError);
                }
            } catch (RuntimeException re) {
                throw re;
            } catch (Exception ex) {
                lastError = ex.getMessage();
            }
        }

        throw new RuntimeException("Runway Video Generation Failed: " + (lastError != null ? lastError : "Unable to establish task."));
    }

    private String pollRunwayTask(String apiKey, String taskId, VideoJob job) throws Exception {
        int polls = 0;
        String[] pollUrls = new String[] {
            "https://api.dev.runwayml.com/v1/tasks/" + taskId,
            "https://api.runwayml.com/v1/tasks/" + taskId
        };

        while (polls < 40) {
            polls++;
            Thread.sleep(4000);
            updateStage(job, Math.min(30 + (polls * 2), 95), "Rendering video via Runway (Task ID: " + taskId + ")");

            for (String pollUrl : pollUrls) {
                try {
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(pollUrl))
                            .header("Authorization", "Bearer " + apiKey)
                            .header("X-Runway-Version", "2024-11-06")
                            .GET()
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    if (response.statusCode() == 200) {
                        Map<String, Object> respMap = objectMapper.readValue(response.body(), Map.class);
                        String status = (String) respMap.get("status");
                        if ("SUCCEEDED".equalsIgnoreCase(status) || "SUCCESS".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
                            Object output = respMap.get("output");
                            if (output instanceof List && !((List<?>) output).isEmpty()) {
                                return ((List<?>) output).get(0).toString();
                            } else if (output instanceof String) {
                                return (String) output;
                            }
                        } else if ("FAILED".equalsIgnoreCase(status)) {
                            throw new RuntimeException("Runway Video Task Failed: " + respMap.get("failure"));
                        }
                        // Still in progress, break inner loop and sleep for next poll
                        break;
                    }
                } catch (RuntimeException re) {
                    throw re;
                } catch (Exception e) {
                    log.warn("Polling error on {}: {}", pollUrl, e.getMessage());
                }
            }
        }
        throw new RuntimeException("Runway Video Generation Timed Out after 160 seconds.");
    }

    private String callReplicateApi(String apiKey, String prompt, VideoJob job) throws Exception {
        log.info("Calling Replicate Video API for job {}", job.getJobId());

        Map<String, Object> requestBody = Map.of(
            "version", "luma/ray",
            "input", Map.of("prompt", prompt, "aspect_ratio", "16:9")
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.replicate.com/v1/predictions"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Replicate API Error (" + response.statusCode() + "): " + response.body());
        }

        Map<String, Object> respMap = objectMapper.readValue(response.body(), Map.class);
        String predId = (String) respMap.get("id");

        int polls = 0;
        while (polls < 30) {
            polls++;
            Thread.sleep(3000);
            updateStage(job, 30 + (polls * 2), "Rendering Replicate Ray Model");

            HttpRequest pollReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.replicate.com/v1/predictions/" + predId))
                    .header("Authorization", "Bearer " + apiKey)
                    .GET()
                    .build();

            HttpResponse<String> pollResp = httpClient.send(pollReq, HttpResponse.BodyHandlers.ofString());
            if (pollResp.statusCode() == 200) {
                Map<String, Object> pMap = objectMapper.readValue(pollResp.body(), Map.class);
                String pStatus = (String) pMap.get("status");
                if ("succeeded".equalsIgnoreCase(pStatus)) {
                    Object output = pMap.get("output");
                    if (output instanceof List && !((List<?>) output).isEmpty()) {
                        return ((List<?>) output).get(0).toString();
                    } else if (output instanceof String) {
                        return (String) output;
                    }
                } else if ("failed".equalsIgnoreCase(pStatus)) {
                    throw new RuntimeException("Replicate Video Prediction Failed: " + pMap.get("error"));
                }
            }
        }
        throw new RuntimeException("Replicate Video Generation Timed Out");
    }

    private String callGenericVideoApi(String apiKey, String prompt, VideoJob job) throws Exception {
        return callRunwayApi(apiKey, prompt, job);
    }

    private String downloadAndSaveMp4(String remoteUrl, Long caseId, String jobId) throws Exception {
        Path videoDir = Paths.get("./data/videos");
        if (!Files.exists(videoDir)) {
            Files.createDirectories(videoDir);
        }
        Path targetFile = videoDir.resolve("video_case_" + caseId + "_" + jobId + ".mp4");

        HttpRequest request = HttpRequest.newBuilder().uri(URI.create(remoteUrl)).GET().build();
        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

        if (response.statusCode() == 200) {
            try (InputStream is = response.body()) {
                Files.copy(is, targetFile, StandardCopyOption.REPLACE_EXISTING);
            }
            return targetFile.toAbsolutePath().toString();
        } else {
            throw new RuntimeException("Failed to download generated MP4 file (HTTP " + response.statusCode() + ")");
        }
    }

    private void updateStage(VideoJob job, int progress, String stage) {
        job.setProgressPercentage(progress);
        job.setCurrentStage(stage);
        jobStore.put(job.getJobId(), job);
    }
}
