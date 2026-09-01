package com.crime.analytics.ai.services.video;

import com.crime.analytics.models.entities.Case;
import java.util.List;
import java.util.Map;

/**
 * Abstraction interface for AI Video Generation Providers (OpenAI Sora, Replicate, Luma AI, etc.)
 */
public interface VideoGenerationProvider {

    /**
     * Check if the provider has valid API key / configuration
     */
    boolean isConfigured();

    /**
     * Get Provider Identifier
     */
    String getProviderName();

    /**
     * Start an asynchronous video generation job
     */
    VideoJob startVideoGeneration(Case caseEntity, String prompt, List<VideoJob.ScenePlanItem> scenePlan);

    /**
     * Poll the current status of an ongoing video generation job
     */
    VideoJob getVideoJobStatus(String jobId);
}
