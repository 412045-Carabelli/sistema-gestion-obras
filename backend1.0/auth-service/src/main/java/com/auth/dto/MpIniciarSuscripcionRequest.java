package com.auth.dto;

import jakarta.validation.constraints.Email;
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

    /**
     * Email con el que se va a pagar en Mercado Pago (opcional). Quien usa el sistema no
     * tiene por qué ser quien paga — MP exige que el payer_email del preapproval coincida
     * con la cuenta MP logueada, así que si no coincide con el email de registro, se puede
     * especificar acá. Si no se manda, se usa el email de la cuenta.
     */
    @Email(message = "Email de pago inválido")
    private String payerEmail;
}
