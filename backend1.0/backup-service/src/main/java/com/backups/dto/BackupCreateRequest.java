package com.backups.dto;

import com.backups.entity.BackupScope;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BackupCreateRequest {
    @NotNull
    private BackupScope scope;

    @Size(max = 500)
    private String comment;

    @Size(max = 120)
    private String requestedBy;
}
