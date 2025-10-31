package com.reportes.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for reportes service.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Builds the OpenAPI metadata bean.
     *
     * @return OpenAPI specification for the service
     */
    @Bean
    public OpenAPI reportesOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Reportes API")
                .version("1.0.0")
                .description("Consultas agregadas de gestión de obras"));
    }
}
