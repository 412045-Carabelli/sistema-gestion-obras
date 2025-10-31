package com.obras.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for obras service.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Provides OpenAPI metadata bean.
     *
     * @return OpenAPI specification
     */
    @Bean
    public OpenAPI obrasOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Obras API")
                .version("1.0.0")
                .description("Gestión de obras, tareas y costos"));
    }
}
