package com.backups.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "backup_job")
@Getter
@Setter
public class BackupJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BackupTriggerType triggerType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BackupScope scope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BackupStatus status;

    @Column(length = 120)
    private String requestedBy;

    @Column(length = 500)
    private String comment;

    @Column(length = 260)
    private String fileName;

    @Column(length = 600)
    private String filePath;

    private Long fileSizeBytes;

    private Long durationMillis;

    @Column(length = 2000)
    private String errorMessage;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime completedAt;
}
