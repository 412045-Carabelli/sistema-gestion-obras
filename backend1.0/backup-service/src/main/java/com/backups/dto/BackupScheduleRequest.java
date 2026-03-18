package com.backups.dto;

import com.backups.entity.BackupFrequency;
import com.backups.entity.BackupScope;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BackupScheduleRequest {
    @NotNull
    private Boolean enabled;

    @NotNull
    private BackupFrequency frequency;

    @NotNull
    private String executionTime;

    @Min(1)
    @Max(7)
    private Integer dayOfWeek;

    @Min(1)
    @Max(28)
    private Integer dayOfMonth;

    @NotNull
    @Min(1)
    @Max(180)
    private Integer retentionCount;

    @NotNull
    private BackupScope scope;

    private String updatedBy;
}
