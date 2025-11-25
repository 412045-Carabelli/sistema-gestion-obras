package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ComisionesResponse {
    private List<Detalle> detalle = new ArrayList<>();
    private BigDecimal totalComision = BigDecimal.ZERO;
    private BigDecimal totalPagos = BigDecimal.ZERO;
    private BigDecimal saldo = BigDecimal.ZERO;

    @Data
    public static class Detalle {
        private Long obraId;
        private String obraNombre;
        private BigDecimal monto = BigDecimal.ZERO;
        private BigDecimal pagos = BigDecimal.ZERO;
        private BigDecimal saldo = BigDecimal.ZERO;
    }
}
