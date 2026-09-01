package com.crime.analytics.api.v1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String response;
    private String answerType;
    private String caseId;
    private String caseNumber;
    private PersonDto person;
    private List<Map<String, Object>> evidence;
    private List<Map<String, Object>> contradictions;
    private List<Map<String, Object>> timelineEvents;
    private List<String> sources;
    private String disclaimer;
    private String entityName;
    private String role;
    private Integer riskScore;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonDto {
        private String caseId;
        private String name;
        private String entityType;
        private String role;
        private String status;
        private String investigationStatus;
        private Integer riskScore;
        private String motive;
        private String alibiStatus;
        private List<String> evidenceIds;
        private List<String> contradictionIds;
        private List<String> timelineEventIds;
    }
}
