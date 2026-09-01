package com.crime.analytics.api.v1.controllers;

import com.crime.analytics.api.v1.dto.*;
import com.crime.analytics.models.entities.*;
import com.crime.analytics.models.repositories.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DashboardController {

    private final CaseRepository caseRepository;
    private final EvidenceRepository evidenceRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationRepository notificationRepository;
    private final AISettingsRepository aiSettingsRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        long total = caseRepository.count();
        long closed = caseRepository.findAll().stream().filter(c -> c.getStatus() == Case.CaseStatus.CLOSED).count();
        long open = total - closed;
        long highPriority = caseRepository.findAll().stream().filter(c -> c.getPriority() == Case.PriorityLevel.HIGH || c.getPriority() == Case.PriorityLevel.CRITICAL).count();
        long pendingEvidence = evidenceRepository.findAll().stream().filter(e -> e.getStatus() == Evidence.EvidenceStatus.PENDING_ANALYSIS).count();

        Map<String, Long> categoryCounts = new HashMap<>();
        categoryCounts.put("Cyber Crime", (long) (total * 0.35));
        categoryCounts.put("Financial Fraud", (long) (total * 0.25));
        categoryCounts.put("Homicide", (long) (total * 0.20));
        categoryCounts.put("Theft/Robbery", (long) (total * 0.20));

        DashboardStatsDto dto = DashboardStatsDto.builder()
                .totalCases(total)
                .openCases(open)
                .closedCases(closed)
                .highPriorityCases(highPriority)
                .pendingEvidence(pendingEvidence)
                .todaysInvestigations(3)
                .crimeCategories(categoryCounts)
                .aiPredictionAccuracy(78.2)
                .avgSolvabilityScore(64.5)
                .build();

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/dashboard/activities")
    public ResponseEntity<?> getRecentActivities(@RequestParam(defaultValue = "20") int limit) {
        List<ActivityLog> logs = activityLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit));
        List<Map<String, Object>> result = logs.stream().map(l -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", l.getId());
            map.put("action", l.getAction());
            map.put("details", l.getDetails());
            map.put("case_id", l.getCase_() != null ? l.getCase_().getId() : null);
            map.put("created_at", l.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/dashboard/analytics")
    public ResponseEntity<?> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        analytics.put("monthly_trends", List.of(
                Map.of("month", "Jan", "cases", 12),
                Map.of("month", "Feb", "cases", 18),
                Map.of("month", "Mar", "cases", 15)
        ));
        analytics.put("resolution_rate", 72.4);
        analytics.put("avg_investigation_days", 42);
        analytics.put("evidence_collection_rate", 68.5);
        analytics.put("ai_accuracy", 78.2);
        analytics.put("hotspots", List.of(
                Map.of("location", "Downtown Business District", "count", 24, "lat", 28.6139, "lng", 77.2090),
                Map.of("location", "Industrial Zone", "count", 15, "lat", 28.5355, "lng", 77.3910),
                Map.of("location", "Residential Area B", "count", 11, "lat", 28.4595, "lng", 77.0266)
        ));
        return ResponseEntity.ok(analytics);
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchGlobal(@Valid @RequestBody SearchRequest request) {
        String q = request.getQuery();
        List<Case> cases = caseRepository.findAll().stream()
                .filter(c -> (c.getCaseNumber() != null && c.getCaseNumber().toLowerCase().contains(q.toLowerCase()))
                        || (c.getTitle() != null && c.getTitle().toLowerCase().contains(q.toLowerCase()))
                        || (c.getDescription() != null && c.getDescription().toLowerCase().contains(q.toLowerCase())))
                .limit(20)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = cases.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("case_id", c.getCaseNumber());
            m.put("title", c.getTitle());
            m.put("status", c.getStatus().name());
            m.put("location", c.getLocationName());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationResponseDto>> getNotifications(Authentication authentication) {
        if (authentication == null) return ResponseEntity.ok(List.of());
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.ok(List.of());

        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<NotificationResponseDto> dtos = list.stream().map(n -> NotificationResponseDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .notificationType(n.getNotificationType())
                .caseId(n.getCase_() != null ? n.getCase_().getId() : null)
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        return notificationRepository.findById(id).map(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
            return ResponseEntity.ok(Map.of("message", "Marked as read"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Admin endpoints
    @GetMapping("/admin/users")
    public ResponseEntity<List<UserDto>> listUsers() {
        List<UserDto> users = userRepository.findAll().stream().map(u -> UserDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .role(u.getRole().name())
                .active(u.getActive())
                .createdAt(u.getCreatedAt())
                .lastLogin(u.getLastLogin())
                .build()).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/admin/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest req) {
        return userRepository.findById(id).map(u -> {
            if (req.getFirstName() != null) u.setFirstName(req.getFirstName());
            if (req.getLastName() != null) u.setLastName(req.getLastName());
            if (req.getActive() != null) u.setActive(req.getActive());
            if (req.getRole() != null) {
                try {
                    u.setRole(User.Role.valueOf(req.getRole()));
                } catch (Exception ignored) {}
            }
            userRepository.save(u);

            auditLogRepository.save(AuditLog.builder()
                    .user(u)
                    .action("user_updated")
                    .resource("user:" + id)
                    .build());

            return ResponseEntity.ok(UserDto.builder()
                    .id(u.getId())
                    .email(u.getEmail())
                    .firstName(u.getFirstName())
                    .lastName(u.getLastName())
                    .role(u.getRole().name())
                    .active(u.getActive())
                    .createdAt(u.getCreatedAt())
                    .lastLogin(u.getLastLogin())
                    .build());
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/ai-settings")
    public ResponseEntity<List<AISettings>> getAiSettings() {
        return ResponseEntity.ok(aiSettingsRepository.findAll());
    }

    @PutMapping("/admin/ai-settings/{key}")
    public ResponseEntity<?> updateAiSetting(@PathVariable String key, @RequestParam String value) {
        AISettings setting = aiSettingsRepository.findByKey(key)
                .orElseGet(() -> AISettings.builder().key(key).value(value).build());
        setting.setValue(value);
        aiSettingsRepository.save(setting);
        return ResponseEntity.ok(setting);
    }
}
