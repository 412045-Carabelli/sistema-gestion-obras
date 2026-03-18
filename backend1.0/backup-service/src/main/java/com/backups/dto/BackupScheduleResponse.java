package com.backups.dto;

import com.backups.entity.BackupFrequency;
import com.backups.entity.BackupScope;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class BackupScheduleResponse {
    private boolean enabled;
    private BackupFrequency frequency;
    private String executionTime;
    private Integer dayOfWeek;
    private Integer dayOfMonth;
    private Integer retentionCount;
    private BackupScope scope;
    private OffsetDateTime nextRunAt;
    private String updatedBy;
    private OffsetDateTime updatedAt;
}
