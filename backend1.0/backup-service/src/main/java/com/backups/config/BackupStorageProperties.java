package com.backups.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "backup.storage")
public class BackupStorageProperties {
    private String rootDir = "data/backups";
    private String environment = "dev";
}
