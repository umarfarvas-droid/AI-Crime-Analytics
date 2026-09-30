package com.crime.analytics.api.v1.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Login response DTO supporting both Python FastAPI and Next.js frontend properties.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @Builder.Default
    @JsonProperty("token_type")
    private String tokenType = "bearer";

    private String token;
    private String email;

    @JsonProperty("full_name")
    private String fullName;

    private String firstName;
    private String lastName;
    private String role;

    public String getToken() {
        return token != null ? token : accessToken;
    }

    public String getAccessToken() {
        return accessToken != null ? accessToken : token;
    }
}
