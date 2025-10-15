package com.obras;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ObrasServiceApplication {
    public static void main(String[] args) {
        var context = SpringApplication.run(ObrasServiceApplication.class, args);
        System.out.println("✅ Puerto configurado: " + context.getEnvironment().getProperty("server.port"));
    }
}

