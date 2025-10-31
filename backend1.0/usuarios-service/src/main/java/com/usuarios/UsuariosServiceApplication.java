package com.usuarios;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Usuarios microservice responsible for managing the
 * platform users and exposing CRUD operations over them.
 */
@SpringBootApplication
@OpenAPIDefinition(info = @Info(title = "Usuarios API", version = "1.0", description = "Gestión de usuarios maestros"))
public class UsuariosServiceApplication {

    /**
     * Bootstraps the Spring Boot context.
     *
     * @param args program arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(UsuariosServiceApplication.class, args);
    }
}
