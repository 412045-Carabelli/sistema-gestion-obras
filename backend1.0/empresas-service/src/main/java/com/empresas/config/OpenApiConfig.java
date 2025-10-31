package com.empresas.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for empresas service.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Provides OpenAPI metadata bean.
     *
     * @return OpenAPI configuration for empresas
     */
    @Bean
    public OpenAPI empresasOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Empresas API")
                .version("1.0.0")
                .description("Gestión de empresas asociadas a usuarios"));
    }
}
