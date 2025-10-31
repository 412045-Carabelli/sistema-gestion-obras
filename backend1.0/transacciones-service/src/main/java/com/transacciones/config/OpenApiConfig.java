package com.transacciones.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for transacciones service.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Creates OpenAPI metadata bean.
     *
     * @return configured OpenAPI instance
     */
    @Bean
    public OpenAPI transaccionesOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Transacciones API")
                .version("1.0.0")
                .description("Gestión de transacciones económicas"));
    }
}
