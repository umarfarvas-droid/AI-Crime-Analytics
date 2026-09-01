package com.crime.analytics.ai.services.video;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data model representing a Video Generation Job, Shot Breakdown, Character/Environment Bibles & Forensic Reconstruction Metadata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoJob {

    private String jobId;
    private Long caseId;
    private String caseNumber;
    private String crimeType;
    private String locationName;
    private JobStatus status; // IDLE, PREPARING, GENERATING_SCENE_PLAN, GENERATING_VISUALS, GENERATING_VIDEO, COMPLETED, FAILED, UNCONFIGURED
    private Integer progressPercentage; // 0 - 100
    private String currentStage; // "Preparing investigation timeline...", "✓ Scene plan generated", "✓ Visual prompts generated", "Rendering scene..."
    private String generationStage; // IDLE, PREPARING, GENERATING_SCENE_PLAN, GENERATING_VISUALS, GENERATING_VIDEO, COMPLETED, FAILED
    private String prompt;
    private String videoUrl;
    private String videoFilePath;
    private String mediaMimeType;
    private Long mediaFileSize;
    private Double durationSeconds;
    private Integer sceneCount;
    private String timelineCoverage;
    private Integer evidenceLinkedCount;
    @Builder.Default
    private List<ScenePlanItem> scenePlan = new ArrayList<>();
    @Builder.Default
    private List<ShotItem> shots = new ArrayList<>();
    @Builder.Default
    private List<CharacterBibleEntry> characterBible = new ArrayList<>();
    @Builder.Default
    private List<EnvironmentBibleEntry> environmentBible = new ArrayList<>();
    private QualityScore qualityScore;
    private String narrativeActStructure;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String providerName;
    private String modelName;
    private String disclaimer;

    public enum JobStatus {
        IDLE,
        PREPARING,
        GENERATING_SCENE_PLAN,
        GENERATING_VISUALS,
        GENERATING_VIDEO,
        UNCONFIGURED,
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED
    }

    /**
     * Character Bible for cross-scene visual and persona consistency
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CharacterBibleEntry {
        private String characterId;        // "PERSON-001"
        private String name;               // "Sameer Khan"
        private String ageCategory;        // "Adult (approx 32-38)"
        private String genderPresentation; // "Male"
        private String clothing;           // "Dark navy tactical jacket, slate trousers, black boots"
        private String hairStyle;          // "Short dark cropped hair, clean shaven"
        private String bodyType;           // "Athletic build, 180cm"
        private String colorPalette;       // "Dark Navy / Charcoal / Slate"
        private String role;               // "Security Contractor / Keycard Holder"
    }

    /**
     * Environment Bible for cross-shot architectural and spatial consistency
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnvironmentBibleEntry {
        private String locationId;         // "LOC-001"
        private String locationName;       // "Metropolitan Heights Executive Suite"
        private String architecture;       // "Modern high-rise commercial executive suite with glass curtain walls"
        private String flooring;           // "Dark herringbone oak parquet flooring"
        private String walls;              // "Brushed architectural concrete and cream acoustic panels"
        private String doors;              // "Frosted glass sliding doors with biometric RFID scanner"
        private String windows;            // "Floor-to-ceiling panoramic windows overlooking night skyline"
        private String furniture;          // "Mahogany conference table, leather executive chairs, server rack cabinet"
        private String lighting;           // "Warm recessed ceiling LEDs, ambient surveillance screen glow (3000K)"
        private String timeOfDay;          // "Night (21:42 - 22:10)"
        private String weather;            // "Overcast night with light rain reflections"
    }

    /**
     * Granular Shot Breakdown (4-8s each) with cinematic lens language and camera physics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShotItem {
        private int shotNumber;            // 1, 2, 3, 4, 5...
        private int sceneNumber;           // Associated scene
        private String act;                // "ACT 1: CONTEXT", "ACT 2: EVENTS", "ACT 3: CRITICAL EVENT", "ACT 4: AFTERMATH"
        private String shotTitle;          // "Establishing Exterior & Access Ingress"
        private String shotType;           // "ESTABLISHING_SHOT", "FOLLOW_SHOT", "OVER_THE_SHOULDER", "CLOSE_UP", "CCTV", "INVESTIGATOR_POV", "WIDE_INTERIOR"
        private String lens;               // "24mm Wide Prime", "35mm Normal", "50mm Cinematic", "85mm Portrait", "100mm Macro"
        private String cameraMovement;     // "Slow cinematic dolly tracking subject from rear-left"
        private double durationSeconds;    // 4.0 - 8.0s
        private String characterId;        // "PERSON-001"
        private String characterName;      // "Sameer Khan"
        private String actionDescription;  // "Approaches biometric terminal and presents encrypted access credential"
        private String visualPrompt;       // Full cinematic prompt
        private String negativePrompt;     // Explicit negative constraints
        private String audioCues;          // "Low ambient room drone, gait-synchronized leather footsteps, 2400Hz RFID chime"
        private String factOrInference;    // "CONFIRMED FACT" vs "INFERRED EVENT"
    }

    /**
     * Calculated Quality Scores derived from automated validation metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityScore {
        private int motionContinuity;       // 0 - 100%
        private int characterConsistency;   // 0 - 100%
        private int environmentConsistency; // 0 - 100%
        private int audioSync;              // 0 - 100%
        private int timelineCoverage;       // 0 - 100%
        private double overallQualityScore; // 0 - 100%
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScenePlanItem {
        private int sceneNumber;
        private String time;
        private String timestamp;
        private String location;
        private String sceneTitle;
        private String event;
        private String visualDescription;
        private String description;
        @Builder.Default
        private List<String> persons = new ArrayList<>();
        @Builder.Default
        private List<String> people = new ArrayList<>();
        @Builder.Default
        private List<String> evidence = new ArrayList<>();
        @Builder.Default
        private List<ShotItem> shots = new ArrayList<>();
        private String visualPrompt;
        private String negativePrompt;
        private String cameraAngle;
        private String camera;
        private String lens;
        private String lightingAtmosphere;
        private String lighting;
        private String factOrInference; // "CONFIRMED FACT" vs "INFERRED EVENT" vs "UNKNOWN"
        private String neutralLanguageNote;
        private Double confidence;
        private String visualFrameSvg;
    }
}
