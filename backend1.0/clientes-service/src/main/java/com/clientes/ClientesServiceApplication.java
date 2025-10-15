package com.clientes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClientesServiceApplication {
    public static void main(String[] args) {
        var context = SpringApplication.run(ClientesServiceApplication.class, args);
        System.out.println("✅ Puerto configurado: " + context.getEnvironment().getProperty("server.port"));
    }
}
