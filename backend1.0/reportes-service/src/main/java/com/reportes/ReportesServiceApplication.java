package com.reportes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class ReportesServiceApplication {
    public static void main(String[] args) {
        System.out.println("🚀 SGO - Reportes Service v1.15.32");
        var context = SpringApplication.run(ReportesServiceApplication.class, args);
        System.out.println("✅ Puerto configurado: " + context.getEnvironment().getProperty("server.port"));
    }
}
