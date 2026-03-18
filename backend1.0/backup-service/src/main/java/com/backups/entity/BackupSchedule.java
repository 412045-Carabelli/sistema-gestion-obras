package com.backups.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "backup_schedule")
@Getter
@Setter
public class BackupSchedule {

    @Id
    private Long id;

    @Column(nullable = false)
    private boolean enabled;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BackupFrequency frequency;

    @Column(nullable = false)
    private LocalTime executionTime;

    private Integer dayOfWeek;

    private Integer dayOfMonth;

    @Column(nullable = false)
    private Integer retentionCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BackupScope scope;

    private OffsetDateTime nextRunAt;

    @Column(length = 120)
    private String updatedBy;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
