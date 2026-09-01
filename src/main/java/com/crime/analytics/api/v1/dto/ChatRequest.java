package com.crime.analytics.api.v1.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    
    @Schema(description = "Investigator query or instruction for AI RAG assistant", example = "Who is Imran Sheikh?")
    @JsonAlias({"question", "query", "prompt", "text"})
    private String message;

    @Schema(description = "Case ID or Case Number for case-scoped RAG queries", example = "CASE-2026-9418")
    @JsonAlias({"case_id", "caseNumber", "case_number"})
    private String caseId;

    private String conversationId;

    public String getQuery() {
        if (message != null && !message.isBlank()) {
            return message.trim();
        }
        return "";
    }
}
