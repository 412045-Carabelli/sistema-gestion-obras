package com.auth.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DescuentoRequest {

    @NotBlank(message = "Código requerido")
    private String codigo;

    private String descripcion;

    @NotNull(message = "Tipo requerido")
    @Pattern(regexp = "PORCENTAJE|MONTO_FIJO", message = "Tipo debe ser PORCENTAJE o MONTO_FIJO")
    private String tipo;

    @NotNull(message = "Valor requerido")
    @DecimalMin("0")
    private BigDecimal valor;

    private Long planId;         // null = todos los planes

    @Pattern(regexp = "MENSUAL|ANUAL", message = "Ciclo debe ser MENSUAL o ANUAL")
    private String aplicaCiclo;  // null = ambos

    private Instant validoDesde;
    private Instant validoHasta; // null = sin vencimiento
    private Integer maxUsos;     // null = ilimitados
    private Boolean soloPrimerPago = Boolean.FALSE;
}
