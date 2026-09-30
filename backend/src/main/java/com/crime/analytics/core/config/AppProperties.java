package com.crime.analytics.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * Application configuration properties
 */
@Component
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {

    private JwtProperties jwt = new JwtProperties();
    private SecurityProperties security = new SecurityProperties();
    private AiProperties ai = new AiProperties();
    private PaginationProperties pagination = new PaginationProperties();
    private VideoProperties video = new VideoProperties();

    @Data
    public static class JwtProperties {
        private String secret;
        private Long expiration;
    }

    @Data
    public static class SecurityProperties {
        private String[] allowedOrigins;
    }

    @Data
    public static class AiProperties {
        private String openaiApiKey;
        private String model;
        private Double temperature;
    }

    @Data
    public static class VideoProperties {
        private String provider = "openai"; // "openai", "replicate", "luma", "none"
        private String apiKey;
        private String model = "sora-1.0";
    }

    @Data
    public static class PaginationProperties {
        private Integer defaultPageSize;
        private Integer maxPageSize;
    }
}
