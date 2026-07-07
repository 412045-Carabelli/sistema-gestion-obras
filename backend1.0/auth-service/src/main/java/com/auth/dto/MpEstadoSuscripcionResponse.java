package com.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MpEstadoSuscripcionResponse {
    private String preapprovalId;
    private String mpStatus;        // authorized | paused | cancelled | pending
    private String estadoLocal;     // ACTIVA | SUSPENDIDA | CANCELADA | PENDIENTE_PAGO
    private String planCodigo;
    private String ciclo;
    private String fechaVencimiento;
    private boolean sincronizado;   // true si DB y MP coincidian
}
