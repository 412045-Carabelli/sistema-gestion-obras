package com.jwt.dto;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * Request payload for JWT generation.
 */
@Schema(description = "Datos necesarios para generar un token JWT")
public record TokenRequest(
        @Schema(description = "Usuario o subject del token", example = "usuario@test.com")
        @NotBlank
        String subject,

        @ArraySchema(arraySchema = @Schema(description = "Roles del usuario"), schema = @Schema(example = "ADMIN"))
        List<String> roles
) {
}
