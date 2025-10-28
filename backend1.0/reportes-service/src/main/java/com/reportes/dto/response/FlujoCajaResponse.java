package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class FlujoCajaResponse {
    private BigDecimal totalIngresos = BigDecimal.ZERO;
    private BigDecimal totalEgresos = BigDecimal.ZERO;
    private BigDecimal saldoFinal = BigDecimal.ZERO;
    private List<Movimiento> movimientos = new ArrayList<>();

    @Data
    public static class Movimiento {
        private Long transaccionId;
        private LocalDate fecha;
        private String tipo;
        private BigDecimal monto = BigDecimal.ZERO;
        private Long obraId;
        private String obraNombre;
        private String formaPago;
        private String asociadoTipo;
        private Long asociadoId;
    }
}
