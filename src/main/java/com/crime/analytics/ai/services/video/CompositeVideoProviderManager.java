package com.crime.analytics.ai.services.video;

import com.crime.analytics.core.config.AppProperties;
import com.crime.analytics.models.entities.Case;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Composite Video Provider Manager
 * Dynamically resolves active provider based on VIDEO_PROVIDER environment variable,
 * application.yml settings, or falls back seamlessly to Mock Forensic Simulation Provider.
 */
@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class CompositeVideoProviderManager implements VideoGenerationProvider {

    private final AppProperties appProperties;
    private final MockVideoProvider mockVideoProvider;
    private final RunwayVideoProvider runwayVideoProvider;
    private final ReplicateVideoProvider replicateVideoProvider;
    private final OpenAiVideoProvider openAiVideoProvider;

    @Override
    public boolean isConfigured() {
        VideoGenerationProvider active = getActiveProvider();
        return active.isConfigured();
    }

    @Override
    public String getProviderName() {
        return getActiveProvider().getProviderName();
    }

    public VideoGenerationProvider getActiveProvider() {
        String providerEnv = System.getenv("VIDEO_PROVIDER");
        if (providerEnv == null || providerEnv.isBlank()) {
            if (appProperties.getVideo() != null && appProperties.getVideo().getProvider() != null) {
                providerEnv = appProperties.getVideo().getProvider();
            }
        }

        if (providerEnv != null) {
            String p = providerEnv.toLowerCase().trim();
            if (p.equals("runway") && runwayVideoProvider.isConfigured()) {
                return runwayVideoProvider;
            } else if (p.equals("replicate") && replicateVideoProvider.isConfigured()) {
                return replicateVideoProvider;
            } else if (p.equals("openai") && openAiVideoProvider.isConfigured()) {
                return openAiVideoProvider;
            } else if (p.equals("mock")) {
                return mockVideoProvider;
            }
        }

        // Auto-detection: if real keys are available, use them; otherwise use Mock Simulation Provider
        if (runwayVideoProvider.isConfigured()) return runwayVideoProvider;
        if (replicateVideoProvider.isConfigured()) return replicateVideoProvider;
        if (openAiVideoProvider.isConfigured()) return openAiVideoProvider;

        return mockVideoProvider;
    }

    @Override
    public VideoJob startVideoGeneration(Case caseEntity, String prompt, List<VideoJob.ScenePlanItem> scenePlan) {
        VideoGenerationProvider active = getActiveProvider();
        log.info("Dispatching video generation for Case #{} to Provider: {}", caseEntity.getId(), active.getProviderName());
        return active.startVideoGeneration(caseEntity, prompt, scenePlan);
    }

    @Override
    public VideoJob getVideoJobStatus(String jobId) {
        if (jobId.startsWith("mock_")) return mockVideoProvider.getVideoJobStatus(jobId);
        if (jobId.startsWith("runway_")) return runwayVideoProvider.getVideoJobStatus(jobId);
        if (jobId.startsWith("replicate_")) return replicateVideoProvider.getVideoJobStatus(jobId);
        if (jobId.startsWith("openai_")) return openAiVideoProvider.getVideoJobStatus(jobId);
        return getActiveProvider().getVideoJobStatus(jobId);
    }
}
