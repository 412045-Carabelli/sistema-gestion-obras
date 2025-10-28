package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EstadoFinancieroObraResponse {
    private Long obraId;
    private String obraNombre;
    private Long clienteId;
    private String clienteNombre;
    private String estadoObra;
    private BigDecimal presupuesto = BigDecimal.ZERO;
    private BigDecimal costos = BigDecimal.ZERO;
    private BigDecimal cobros = BigDecimal.ZERO;
    private BigDecimal pagos = BigDecimal.ZERO;
    private BigDecimal utilidadNeta = BigDecimal.ZERO;
    private String notas;
}
