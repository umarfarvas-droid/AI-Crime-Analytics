package com.crime.analytics.api.v1.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.crime.analytics.api.v1.dto.LoginRequest;
import com.crime.analytics.api.v1.dto.LoginResponse;
import com.crime.analytics.api.v1.dto.RegisterRequest;
import com.crime.analytics.api.v1.dto.UserDto;
import com.crime.analytics.core.security.JwtTokenProvider;
import com.crime.analytics.models.entities.AuditLog;
import com.crime.analytics.models.entities.User;
import com.crime.analytics.models.repositories.AuditLogRepository;
import com.crime.analytics.models.repositories.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Authentication controller for user login, registration, refresh, password recovery, and profile.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * User login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getActive() != null && !user.getActive()) {
                Map<String, String> error = new HashMap<>();
                error.put("detail", "Account deactivated");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            // Update last login
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            String roleStr = user.getRole() != null ? user.getRole().toString() : "INVESTIGATOR";
            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", String.valueOf(user.getId()));
            claims.put("role", roleStr);
            claims.put("email", user.getEmail());

            String accessToken = jwtTokenProvider.generateToken(user.getEmail(), claims);
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

            auditLogRepository.save(AuditLog.builder()
                    .user(user)
                    .action("login")
                    .resource("auth")
                    .build());

            return ResponseEntity.ok(LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("bearer")
                    .token(accessToken)
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .firstName(user.getFirstName() != null ? user.getFirstName() : "Test")
                    .lastName(user.getLastName() != null ? user.getLastName() : "User")
                    .role(roleStr)
                    .build());

        } catch (Exception e) {
            log.error("Login failed for email: {}", loginRequest.getEmail(), e);
            Map<String, String> error = new HashMap<>();
            error.put("detail", "Invalid credentials");
            error.put("error", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * User registration endpoint
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("detail", "Email already registered");
                error.put("error", "Email already registered");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            String fullName = registerRequest.getFullName();
            String firstName = registerRequest.getFirstName();
            String lastName = registerRequest.getLastName();

            User newUser = User.builder()
                    .email(registerRequest.getEmail())
                    .password(passwordEncoder.encode(registerRequest.getPassword()))
                    .fullName(fullName)
                    .firstName(firstName)
                    .lastName(lastName)
                    .badgeNumber(registerRequest.getBadgeNumber())
                    .department(registerRequest.getDepartment())
                    .role(User.Role.ANALYST)
                    .active(true)
                    .build();

            newUser = userRepository.save(newUser);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("email", newUser.getEmail());
            response.put("id", newUser.getId());
            response.put("full_name", newUser.getFullName());
            response.put("role", newUser.getRole().toString());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Registration failed", e);
            Map<String, String> error = new HashMap<>();
            error.put("detail", "Registration failed: " + e.getMessage());
            error.put("error", "Registration failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Token refresh endpoint
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @RequestParam(required = false, name = "refresh_token") String queryRefresh,
            @RequestBody(required = false) Map<String, String> body) {
        String token = queryRefresh;
        if (token == null && body != null) {
            token = body.get("refresh_token");
            if (token == null) token = body.get("refreshToken");
        }

        if (token == null || !jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("detail", "Invalid refresh token"));
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || (user.getActive() != null && !user.getActive())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("detail", "User not found or inactive"));
        }

        String roleStr = user.getRole() != null ? user.getRole().toString() : "INVESTIGATOR";
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", String.valueOf(user.getId()));
        claims.put("role", roleStr);

        String newAccess = jwtTokenProvider.generateToken(user.getEmail(), claims);
        String newRefresh = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return ResponseEntity.ok(LoginResponse.builder()
                .accessToken(newAccess)
                .refreshToken(newRefresh)
                .tokenType("bearer")
                .token(newAccess)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(roleStr)
                .build());
    }

    /**
     * Password recovery endpoint
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestParam(required = false) String email,
            @RequestBody(required = false) Map<String, String> body) {
        String targetEmail = email;
        if (targetEmail == null && body != null) {
            targetEmail = body.get("email");
        }

        if (targetEmail == null || targetEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email is required"));
        }

        var userOpt = userRepository.findByEmail(targetEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        auditLogRepository.save(AuditLog.builder()
                .user(user)
                .action("password_reset_requested")
                .resource("auth")
                .build());

        return ResponseEntity.ok(Map.of("message", "Password reset link sent to email"));
    }

    /**
     * Current authenticated user endpoint
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("detail", "Not authenticated"));
        }

        User u = null;
        if (authentication.getPrincipal() instanceof User userPrincipal) {
            u = userPrincipal;
        } else {
            String name = authentication.getName();
            u = userRepository.findByEmail(name)
                    .or(() -> {
                        try {
                            Long id = Long.parseLong(name);
                            return userRepository.findById(id);
                        } catch (NumberFormatException e) {
                            return java.util.Optional.empty();
                        }
                    })
                    .orElse(null);
        }

        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "User not found"));
        }

        return ResponseEntity.ok(UserDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .role(u.getRole() != null ? u.getRole().toString() : "INVESTIGATOR")
                .badgeNumber(u.getBadgeNumber())
                .department(u.getDepartment())
                .active(u.getActive() != null ? u.getActive() : true)
                .createdAt(u.getCreatedAt())
                .lastLogin(u.getLastLogin())
                .build());
    }
}
