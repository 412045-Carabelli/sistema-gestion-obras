package com.empresas.dto;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Request payload for company operations.
 */
@Schema(description = "Payload para crear o actualizar empresas")
public record EmpresaRequest(
        @Schema(description = "Razón social de la empresa", example = "Constructora Andes S.A.")
        @NotBlank
        @Size(max = 200)
        String razonSocial,

        @Schema(description = "Identificador del usuario propietario", example = "1")
        @NotNull
        Long usuarioId,

        @Schema(description = "Indica si la empresa está activa", example = "true")
        Boolean activa,

        @ArraySchema(arraySchema = @Schema(description = "Listado de obras asociadas"),
                schema = @Schema(example = "10"))
        List<Long> obras
) {
}
