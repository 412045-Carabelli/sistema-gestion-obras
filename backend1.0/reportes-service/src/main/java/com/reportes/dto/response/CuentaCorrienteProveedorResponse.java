package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class CuentaCorrienteProveedorResponse {
    private Long proveedorId;
    private String proveedorNombre;
    private BigDecimal costos = BigDecimal.ZERO;
    private BigDecimal pagos = BigDecimal.ZERO;
    private BigDecimal saldo = BigDecimal.ZERO;
    private List<Movimiento> movimientos = new ArrayList<>();

    @Data
    public static class Movimiento {
        private java.time.LocalDate fecha;
        private String tipo;
        private BigDecimal monto = BigDecimal.ZERO;
        private Long obraId;
        private String obraNombre;
        private String concepto;
        private BigDecimal costosAcumulados = BigDecimal.ZERO;
        private BigDecimal pagosAcumulados = BigDecimal.ZERO;
        private BigDecimal saldoProveedor = BigDecimal.ZERO;
    }
}
