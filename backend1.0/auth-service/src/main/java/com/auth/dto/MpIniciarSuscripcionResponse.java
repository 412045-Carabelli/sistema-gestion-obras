package com.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MpIniciarSuscripcionResponse {
    private String initPoint;        // URL de checkout MP → redirigir al usuario
    private String preapprovalId;    // ID de la suscripción en MP
    private String externalReference; // nuestro ID interno (suscripcionId)
    private String estado;           // PENDIENTE_PAGO
    private BigDecimal montoArs;         // monto real que MP va a cobrar (ya convertido)
    private BigDecimal cotizacionUsdArs; // cotización usada para la conversión
}
