package com.crime.analytics.ai.services.video;

import com.crime.analytics.core.config.AppProperties;
import com.crime.analytics.models.entities.Case;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OpenAI Forensic Scene Video Generation Provider
 */
@Slf4j
@Component("openAiVideoProvider")
@RequiredArgsConstructor
public class OpenAiVideoProvider implements VideoGenerationProvider {

    private final AppProperties appProperties;
    private final Map<String, VideoJob> jobStore = new ConcurrentHashMap<>();

    @Override
    public boolean isConfigured() {
        String key = getApiKey();
        return key != null && !key.isBlank() 
                && !key.equalsIgnoreCase("none") 
                && !key.equalsIgnoreCase("your-openai-api-key")
                && !key.equalsIgnoreCase("your-api-key")
                && !key.contains("sk-proj-crime-analytics-forensic-sora-v1");
    }

    private String getApiKey() {
        String envOpenAi = System.getenv("OPENAI_API_KEY");
        if (envOpenAi != null && !envOpenAi.isBlank()) return envOpenAi;
        if (appProperties.getAi() != null && appProperties.getAi().getOpenaiApiKey() != null) {
            return appProperties.getAi().getOpenaiApiKey();
        }
        return null;
    }

    @Override
    public String getProviderName() {
        return "openai";
    }

    @Override
    public VideoJob startVideoGeneration(Case caseEntity, String prompt, List<VideoJob.ScenePlanItem> scenePlan) {
        String jobId = "openai_job_" + UUID.randomUUID().toString().substring(0, 8);
        String disclaimer = "AI-generated investigative visualization based on the submitted FIR and extracted case data. It is a simulation and does not constitute actual evidence or proof of guilt.";

        if (!isConfigured()) {
            VideoJob unconf = VideoJob.builder()
                    .jobId(jobId)
                    .caseId(caseEntity.getId())
                    .caseNumber(caseEntity.getCaseNumber())
                    .status(VideoJob.JobStatus.UNCONFIGURED)
                    .currentStage("AI Video Provider Not Configured")
                    .errorMessage("OpenAI API Key is not configured. Configure OPENAI_API_KEY environment variable.")
                    .sceneCount(scenePlan.size())
                    .scenePlan(scenePlan)
                    .createdAt(LocalDateTime.now())
                    .providerName("OpenAI")
                    .modelName("sora-1.0")
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
                .progressPercentage(20)
                .currentStage("Submitting forensic prompt to OpenAI Sora...")
                .prompt(prompt)
                .sceneCount(scenePlan.size())
                .scenePlan(scenePlan)
                .createdAt(LocalDateTime.now())
                .providerName("OpenAI")
                .modelName("sora-1.0")
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
                .errorMessage("Job not found.")
                .build());
    }
}
