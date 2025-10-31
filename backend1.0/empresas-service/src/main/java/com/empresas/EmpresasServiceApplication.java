package com.empresas;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Empresas microservice that handles the company catalog.
 */
@SpringBootApplication
@OpenAPIDefinition(info = @Info(title = "Empresas API", version = "1.0", description = "Gestión de empresas asociadas"))
public class EmpresasServiceApplication {

    /**
     * Launches the microservice.
     *
     * @param args runtime arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(EmpresasServiceApplication.class, args);
    }
}
