package com.backups.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BackupRestoreResponse {
    private Long backupId;
    private String backupFileName;
    private int tablesRestored;
    private int documentFilesRestored;
    private String message;
}
