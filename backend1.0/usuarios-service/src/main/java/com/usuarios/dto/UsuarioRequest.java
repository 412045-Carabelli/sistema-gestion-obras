package com.usuarios.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload used to create or update users.
 */
@Schema(description = "Payload para crear o actualizar usuarios")
public record UsuarioRequest(
        @Schema(description = "Nombre completo del usuario", example = "Juan Pérez")
        @NotBlank
        @Size(max = 150)
        String nombre,

        @Schema(description = "Correo electrónico", example = "juan@example.com")
        @Email
        @NotBlank
        @Size(max = 150)
        String email,

        @Schema(description = "Teléfono de contacto", example = "+54 9 11 5555 5555")
        @Size(max = 30)
        String telefono,

        @Schema(description = "Indica si el usuario está activo", example = "true")
        Boolean activo
) {
}
