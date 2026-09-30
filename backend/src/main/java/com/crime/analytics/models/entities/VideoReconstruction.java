package com.crime.analytics.models.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * JPA Entity for persisting AI Crime Scene Video Reconstruction Metadata & File Paths
 */
@Entity
@Table(name = "video_reconstructions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class VideoReconstruction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case caseEntity;

    @Column(nullable = false)
    private String provider;

    private String model;

    @Column(name = "job_id", nullable = false)
    private String jobId;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "scene_plan_json", columnDefinition = "LONGTEXT")
    private String scenePlanJson;

    @Column(name = "video_path")
    private String videoPath;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
