package com.crime.analytics.api.v1.controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.crime.analytics.api.v1.dto.LoginRequest;
import com.crime.analytics.api.v1.dto.RegisterRequest;
import com.crime.analytics.models.entities.User;
import com.crime.analytics.models.repositories.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Test cases for AuthController
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

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
        userRepository.deleteAll();
    }

    @Test
    void testRegisterNewUser() throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("testPassword123")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User registered successfully"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void testRegisterDuplicateEmail() throws Exception {
        // Create existing user
        User existingUser = User.builder()
                .email("existing@example.com")
                .password(passwordEncoder.encode("password"))
                .firstName("Jane")
                .lastName("Doe")
                .role(User.Role.ANALYST)
                .active(true)
                .build();
        userRepository.save(existingUser);

        // Try to register with same email
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email("existing@example.com")
                .password("newPassword123")
                .firstName("John")
                .lastName("Smith")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void testLoginWithValidCredentials() throws Exception {
        // Create user
        User user = User.builder()
                .email("login@example.com")
                .password(passwordEncoder.encode("testPassword123"))
                .firstName("Test")
                .lastName("User")
                .role(User.Role.ANALYST)
                .active(true)
                .build();
        userRepository.save(user);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("login@example.com")
                .password("testPassword123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("login@example.com"))
                .andExpect(jsonPath("$.firstName").value("Test"))
                .andExpect(jsonPath("$.role").value("ANALYST"));
    }

    @Test
    void testLoginWithInvalidPassword() throws Exception {
        // Create user
        User user = User.builder()
                .email("invalid@example.com")
                .password(passwordEncoder.encode("correctPassword"))
                .firstName("Test")
                .lastName("User")
                .role(User.Role.ANALYST)
                .active(true)
                .build();
        userRepository.save(user);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("invalid@example.com")
                .password("wrongPassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void testLoginWithNonExistentUser() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("password")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void testForgotPasswordWithValidEmail() throws Exception {
        // Create user
        User user = User.builder()
                .email("forget@example.com")
                .password(passwordEncoder.encode("password"))
                .firstName("Test")
                .lastName("User")
                .role(User.Role.ANALYST)
                .active(true)
                .build();
        userRepository.save(user);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .param("email", "forget@example.com")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset link sent to email"));
    }

    @Test
    void testForgotPasswordWithNonExistentEmail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .param("email", "nonexistent@example.com")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found"));
    }
}
