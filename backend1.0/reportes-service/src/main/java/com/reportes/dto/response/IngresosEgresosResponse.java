package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class IngresosEgresosResponse {
    private BigDecimal totalIngresos = BigDecimal.ZERO;
    private BigDecimal totalEgresos = BigDecimal.ZERO;
    private List<DetalleObra> detallePorObra = new ArrayList<>();

    @Data
    public static class DetalleObra {
        private Long obraId;
        private String obraNombre;
        private Long clienteId;
        private String clienteNombre;
        private BigDecimal ingresos = BigDecimal.ZERO;
        private BigDecimal egresos = BigDecimal.ZERO;
    }
}
