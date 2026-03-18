package com.backups.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BackupSummaryResponse {
    private BackupJobResponse lastSuccessfulBackup;
    private BackupScheduleResponse schedule;
    private Long totalBackups;
    private Long totalStorageBytes;
}
