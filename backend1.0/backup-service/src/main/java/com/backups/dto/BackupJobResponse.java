package com.backups.dto;

import com.backups.entity.BackupScope;
import com.backups.entity.BackupStatus;
import com.backups.entity.BackupTriggerType;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class BackupJobResponse {
    private Long id;
    private BackupTriggerType triggerType;
    private BackupScope scope;
    private BackupStatus status;
    private String requestedBy;
    private String comment;
    private String fileName;
    private String filePath;
    private Long fileSizeBytes;
    private Long durationMillis;
    private String errorMessage;
    private OffsetDateTime createdAt;
    private OffsetDateTime completedAt;
}
