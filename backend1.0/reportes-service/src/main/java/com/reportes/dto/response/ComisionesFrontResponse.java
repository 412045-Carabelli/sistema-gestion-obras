package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ComisionesFrontResponse {
    private BigDecimal total = BigDecimal.ZERO;
    private List<ComisionItem> comisiones = new ArrayList<>();

    @Data
    public static class ComisionItem {
        private Long obraId;
        private String obraNombre;
        private BigDecimal porcentaje;
        private BigDecimal monto = BigDecimal.ZERO;
    }
}
