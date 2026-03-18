package com.backups.repository;

import com.backups.entity.BackupSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BackupScheduleRepository extends JpaRepository<BackupSchedule, Long> {
}
