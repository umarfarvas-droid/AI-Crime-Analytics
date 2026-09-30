package com.crime.analytics.api.v1.dto;

import com.crime.analytics.models.entities.Evidence;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Evidence creation request DTO with Swagger example schemas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvidenceCreateRequest {

    @Schema(description = "Associated Case ID", example = "1")
    @NotNull(message = "Case ID is required")
    private Long caseId;

    @Schema(description = "Title of the evidence item", example = "CCTV Vault Footage")
    @NotBlank(message = "Title is required")
    private String title;

    @Schema(description = "Detailed evidence description", example = "High-definition security footage showing silver sedan fleeing vault at 09:18 AM.")
    private String description;

    @Schema(description = "Type of evidence", example = "DIGITAL")
    private Evidence.EvidenceType type;

    @Schema(description = "File path or attachment location", example = "/uploads/cctv_vault_01.mp4")
    private String filePath;

    @Schema(description = "Extracted text or transcripts", example = "License plate XYZ-987 visible on rear bumper.")
    private String ocrText;

    @Schema(description = "Investigator who collected the evidence", example = "Det. Smith")
    private String collectedBy;
}
