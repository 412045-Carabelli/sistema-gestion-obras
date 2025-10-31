package com.clientes.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for the clientes service.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Builds the OpenAPI specification metadata.
     *
     * @return OpenAPI bean with service documentation
     */
    @Bean
    public OpenAPI clientesOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Clientes API")
                .version("1.0.0")
                .description("Operaciones para gestionar clientes"));
    }
}
