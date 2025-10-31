package com.jwt.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * Response payload that contains the generated token and metadata.
 */
@Schema(description = "Token generado con su fecha de expiración")
public record TokenResponse(
        @Schema(description = "Token JWT", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...") String token,
        @Schema(description = "Fecha de expiración en formato epoch") Instant expiresAt
) {
}
