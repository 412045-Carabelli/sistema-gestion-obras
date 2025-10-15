package com.documentos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DocumentosServiceApplication {
    public static void main(String[] args) {
        var context = SpringApplication.run(DocumentosServiceApplication.class, args);
        System.out.println("✅ Puerto configurado: " + context.getEnvironment().getProperty("server.port"));
    }
}
