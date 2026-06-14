package com.transacciones.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class TusFacturasResponseDto {

    /** "N" = éxito, "S" = error */
    private String error;

    private List<String> errores;

    /** Mensaje descriptivo del resultado */
    private String rta;

    /** Código de Autorización Electrónica (CAE) */
    private String cae;

    /** Fecha de vencimiento del CAE (dd/MM/yyyy) */
    @JsonProperty("vencimiento_cae")
    private String vencimientoCae;

    /** URL del PDF del comprobante */
    @JsonProperty("comprobante_pdf_url")
    private String comprobantePdfUrl;

    /** URL del QR de validación AFIP */
    @JsonProperty("afip_qr")
    private String afipQr;

    /** Número de comprobante emitido */
    @JsonProperty("comprobante_nro")
    private String comprobanteNro;

    /** Tipo de comprobante emitido */
    @JsonProperty("comprobante_tipo")
    private String comprobanteTipo;
}
