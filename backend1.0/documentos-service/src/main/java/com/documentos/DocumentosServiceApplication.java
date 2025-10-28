package com.documentos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class DocumentosServiceApplication {
    public static void main(String[] args) {
        File dbDir = new File("data");
        if (!dbDir.exists()) {
            dbDir.mkdirs();
        }
        var context = SpringApplication.run(DocumentosServiceApplication.class, args);
        System.out.println("✅ Puerto configurado: " + context.getEnvironment().getProperty("server.port"));
    }
}
