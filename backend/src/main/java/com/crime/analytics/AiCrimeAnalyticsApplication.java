package com.crime.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Legacy entry point alias for CrimeAnalyticsApplication.
 */
public class AiCrimeAnalyticsApplication extends CrimeAnalyticsApplication {

    public static void main(String[] args) {
        CrimeAnalyticsApplication.main(args);
    }
}
