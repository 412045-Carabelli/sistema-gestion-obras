package com.backups.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "backup.documents")
public class BackupDocumentProperties {
    private String rootDir = "uploads-dev";
    private Minio minio = new Minio();

    @Getter
    @Setter
    public static class Minio {
        private boolean enabled = false;
        private String url = "http://localhost:9000";
        private String accessKey = "minioadmin";
        private String secretKey = "minioadmin";
        private String bucket = "documentos";
    }
}
