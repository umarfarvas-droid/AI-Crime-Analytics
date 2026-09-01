package com.crime.analytics.api.v1.controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.crime.analytics.models.entities.Case;
import com.crime.analytics.models.repositories.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

import java.time.LocalDate;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CasesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private EvidenceRepository evidenceRepository;

    @Autowired
    private SuspectRepository suspectRepository;

    @Autowired
    private ExtractedEntityRepository extractedEntityRepository;

    @Autowired
    private CaseAnalysisRepository caseAnalysisRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private VideoReconstructionRepository videoReconstructionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private Case testCase;

    @BeforeEach
    void setUp() {
        videoReconstructionRepository.deleteAll();
        chatMessageRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        activityLogRepository.deleteAll();
        reportRepository.deleteAll();
        documentRepository.deleteAll();
        extractedEntityRepository.deleteAll();
        caseAnalysisRepository.deleteAll();
        evidenceRepository.deleteAll();
        suspectRepository.deleteAll();
        caseRepository.deleteAll();
        
        com.crime.analytics.models.entities.User admin = userRepository.findByEmail("admin@crimeanalytics.gov")
                .orElseGet(() -> userRepository.save(com.crime.analytics.models.entities.User.builder()
                        .firstName("Test")
                        .lastName("Admin")
                        .email("admin@crimeanalytics.gov")
                        .password("password")
                        .role(com.crime.analytics.models.entities.User.Role.ADMIN)
                        .active(true)
                        .build()));

        testCase = Case.builder()
                .caseNumber("CASE-2024-001")
                .title("Test Case")
                .description("Test Description")
                .status(Case.CaseStatus.OPEN)
                .type(Case.CaseType.HOMICIDE)
                .priority(Case.PriorityLevel.HIGH)
                .incidentDate(LocalDate.now())
                .locationName("Test Location")
                .createdBy(admin)
                .build();

        caseRepository.save(testCase);
    }

    @Test
    @WithMockUser
    void testGetAllCases() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[0].title").value("Test Case"));
    }

    @Test
    @WithMockUser
    void testGetCaseById() throws Exception {
        mockMvc.perform(get("/api/v1/cases/" + testCase.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testCase.getId().intValue()))
                .andExpect(jsonPath("$.title").value("Test Case"));
    }

    @Test
    @WithMockUser
    void testGetNonExistentCase() throws Exception {
        mockMvc.perform(get("/api/v1/cases/99999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void testSearchCases() throws Exception {
        mockMvc.perform(get("/api/v1/cases/search")
                .param("keyword", "Test")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @WithMockUser
    void testGetCasesByStatus() throws Exception {
        mockMvc.perform(get("/api/v1/cases/status/" + Case.CaseStatus.OPEN)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @WithMockUser
    void testGetCasesByPriority() throws Exception {
        mockMvc.perform(get("/api/v1/cases/priority/" + Case.PriorityLevel.HIGH)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @WithMockUser
    void testDeleteCase() throws Exception {
        mockMvc.perform(delete("/api/v1/cases/" + testCase.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/cases/" + testCase.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
