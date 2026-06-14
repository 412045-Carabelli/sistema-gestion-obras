package com.transacciones.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmisionElectronicaRequest {

    /** Tipo de comprobante: "FACTURA B", "FACTURA A", "FACTURA C" */
    private String tipoComprobante;

    /** Razón social o nombre del cliente */
    private String clienteRazonSocial;

    /** Tipo de documento: "DNI", "CUIT", "OTRO" */
    private String clienteDocumentoTipo;

    /** Número de documento o CUIT (sin guiones) */
    private String clienteDocumentoNro;

    /** Condición IVA: "CF" (Consumidor Final), "RI" (Resp. Inscripto), "MT" (Monotributista) */
    private String clienteCondicionIva;

    /** Email del cliente (opcional) */
    private String clienteEmail;

    /** Alícuota IVA: 21, 10.5, 27, 0 — default 21 */
    private Double alicuotaIva;
}
