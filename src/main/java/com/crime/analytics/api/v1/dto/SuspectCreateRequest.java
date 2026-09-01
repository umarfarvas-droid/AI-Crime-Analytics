package com.crime.analytics.api.v1.dto;

import com.crime.analytics.models.entities.Suspect;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Suspect creation request DTO with Swagger example schemas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspectCreateRequest {

    @Schema(description = "Associated Case ID", example = "1")
    @NotNull(message = "Case ID is required")
    private Long caseId;

    @Schema(description = "Full legal name of the suspect", example = "Marcus Vance")
    @NotBlank(message = "Full name is required")
    private String fullName;

    @Schema(description = "Known street alias or moniker", example = "The Locksmith")
    private String alias;

    @Schema(description = "Suspect status", example = "SUSPECT")
    private Suspect.SuspectStatus status;

    @Schema(description = "Stated alibi statement", example = "Claims to have been at a diner 10 miles away at 09:15 AM.")
    private String alibi;

    @Schema(description = "Investigator background notes and criminal record history", example = "Prior convictions for safe cracking and vault entry.")
    private String notes;
}
