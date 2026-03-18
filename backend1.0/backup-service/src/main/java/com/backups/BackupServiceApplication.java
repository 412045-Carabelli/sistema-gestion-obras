package com.backups;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackupServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackupServiceApplication.class, args);
    }
}
