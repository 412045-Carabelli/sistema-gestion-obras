package com.usuarios.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;

/**
 * Response payload representing a user.
 */
@Schema(description = "Representación de un usuario con metadatos de auditoría")
public record UsuarioResponse(
        @Schema(description = "Identificador interno", example = "1") Long id,
        @Schema(description = "Nombre completo", example = "Juan Pérez") String nombre,
        @Schema(description = "Correo electrónico", example = "juan@example.com") String email,
        @Schema(description = "Teléfono de contacto", example = "+54 9 11 5555 5555") String telefono,
        @Schema(description = "Indicador de estado", example = "true") Boolean activo,
        @Schema(description = "Fecha de creación") OffsetDateTime createdAt,
        @Schema(description = "Última fecha de actualización") OffsetDateTime updatedAt,
        @Schema(description = "Usuario que creó el registro", example = "system") String createdBy,
        @Schema(description = "Usuario que modificó por última vez", example = "system") String updatedBy
) {
}
