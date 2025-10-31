package com.usuarios.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for usuarios service.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Provides OpenAPI metadata bean.
     *
     * @return OpenAPI instance for usuarios
     */
    @Bean
    public OpenAPI usuariosOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Usuarios API")
                .version("1.0.0")
                .description("Catálogo maestro de usuarios"));
    }
}
