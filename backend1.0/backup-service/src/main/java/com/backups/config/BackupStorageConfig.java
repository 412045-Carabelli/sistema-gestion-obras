package com.backups.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({BackupStorageProperties.class, BackupDocumentProperties.class})
public class BackupStorageConfig {
}
