package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class CuentaCorrienteObraResponse {
    private Long obraId;
    private String obraNombre;
    private Long clienteId;
    private String clienteNombre;
    private BigDecimal costoTotal = BigDecimal.ZERO;
    private BigDecimal pagosRecibidos = BigDecimal.ZERO;
    private BigDecimal saldoPendiente = BigDecimal.ZERO;
    private List<Movimiento> movimientos = new ArrayList<>();

    @Data
    public static class Movimiento {
        private String tipo;
        private BigDecimal monto = BigDecimal.ZERO;
        private String referencia;
    }
}
