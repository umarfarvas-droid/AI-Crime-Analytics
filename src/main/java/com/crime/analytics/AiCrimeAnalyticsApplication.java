package com.crime.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot application entry point for AI Crime Analytics system
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@ComponentScan(basePackages = {"com.crime.analytics"})
public class AiCrimeAnalyticsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiCrimeAnalyticsApplication.class, args);
    }

}
