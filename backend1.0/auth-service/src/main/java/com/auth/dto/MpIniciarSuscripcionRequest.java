package com.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MpIniciarSuscripcionRequest {

    @NotNull(message = "planId requerido")
    private Long planId;

    /** MENSUAL | ANUAL */
    @NotBlank(message = "ciclo requerido")
    private String ciclo;

    /** Código de descuento (opcional) */
    private String codigoDescuento;
}
