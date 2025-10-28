package com.clientes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class ClientesServiceApplication {
    public static void main(String[] args) {
        File dbDir = new File("data");
        if (!dbDir.exists()) {
            dbDir.mkdirs();
        }
        var context = SpringApplication.run(ClientesServiceApplication.class, args);
        System.out.println("✅ Puerto configurado: " + context.getEnvironment().getProperty("server.port"));
    }
}
