package com.backups.repository;

import com.backups.entity.BackupJob;
import com.backups.entity.BackupStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BackupJobRepository extends JpaRepository<BackupJob, Long> {
    List<BackupJob> findAllByOrderByCreatedAtDesc();
    List<BackupJob> findByStatusOrderByCreatedAtDesc(BackupStatus status);
    Optional<BackupJob> findTopByStatusOrderByCompletedAtDesc(BackupStatus status);
}
