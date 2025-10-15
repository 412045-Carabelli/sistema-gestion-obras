package com.transacciones;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TransaccionServiceApplication {
    public static void main(String[] args) {
        var context = SpringApplication.run(TransaccionServiceApplication.class, args);
        System.out.println("✅ Puerto configurado: " + context.getEnvironment().getProperty("server.port"));
    }
}
