package com.crime.analytics.models.repositories;

import com.crime.analytics.models.entities.AISettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AISettingsRepository extends JpaRepository<AISettings, Long> {
    Optional<AISettings> findByKey(String key);
}
