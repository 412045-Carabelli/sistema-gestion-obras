package com.empresas.dto;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Response payload containing company data and audit metadata.
 */
@Schema(description = "Representación de empresa con metadatos de auditoría")
public record EmpresaResponse(
        @Schema(description = "Identificador interno", example = "1") Long id,
        @Schema(description = "Razón social", example = "Constructora Andes S.A.") String razonSocial,
        @Schema(description = "Usuario propietario", example = "1") Long usuarioId,
        @Schema(description = "Empresa activa", example = "true") Boolean activa,
        @ArraySchema(arraySchema = @Schema(description = "Listado de obras"), schema = @Schema(example = "10"))
        List<Long> obras,
        @Schema(description = "Fecha de creación") OffsetDateTime createdAt,
        @Schema(description = "Última actualización") OffsetDateTime updatedAt,
        @Schema(description = "Usuario creador", example = "system") String createdBy,
        @Schema(description = "Usuario último modificador", example = "system") String updatedBy
) {
}
