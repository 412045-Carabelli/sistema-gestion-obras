package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class CuentaCorrienteClienteResponse {
    private Long clienteId;
    private String clienteNombre;
    private BigDecimal totalCobros = BigDecimal.ZERO;
    private BigDecimal totalCostos = BigDecimal.ZERO;
    private BigDecimal saldoFinal = BigDecimal.ZERO;
    private List<Movimiento> movimientos = new ArrayList<>();

    @Data
    public static class Movimiento {
        private LocalDate fecha;
        private Long obraId;
        private String obraNombre;
        private String concepto;
        private String referencia;
        private String tipo;
        private BigDecimal monto = BigDecimal.ZERO;
        private String asociadoTipo;
        private Long asociadoId;
        private BigDecimal cobrosAcumulados = BigDecimal.ZERO;
        private BigDecimal costosAcumulados = BigDecimal.ZERO;
        private BigDecimal saldoCliente = BigDecimal.ZERO;
    }
}
