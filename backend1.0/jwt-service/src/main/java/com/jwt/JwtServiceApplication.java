package com.jwt;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the JWT microservice which centralises token issuing.
 */
@SpringBootApplication
@OpenAPIDefinition(info = @Info(title = "JWT API", version = "1.0", description = "Servicio de emisión de tokens JWT"))
public class JwtServiceApplication {

    /**
     * Launches the application.
     *
     * @param args runtime arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(JwtServiceApplication.class, args);
    }
}
