package proveedores.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI configuration for proveedores service.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Creates the OpenAPI bean.
     *
     * @return OpenAPI with metadata
     */
    @Bean
    public OpenAPI proveedoresOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Proveedores API")
                .version("1.0.0")
                .description("Gestión de proveedores y sus tipos"));
    }
}
