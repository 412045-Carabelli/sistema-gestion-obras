package com.documentos.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for documentos service.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Creates the OpenAPI bean.
     *
     * @return OpenAPI metadata
     */
    @Bean
    public OpenAPI documentosOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Documentos API")
                .version("1.0.0")
                .description("Gestión reactiva de documentos"));
    }
}
