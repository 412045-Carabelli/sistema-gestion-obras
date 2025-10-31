package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class AvanceTareasResponse {
    private List<AvanceObra> avances = new ArrayList<>();

    @Data
    public static class AvanceObra {
        private Long obraId;
        private String obraNombre;
        private BigDecimal porcentaje = BigDecimal.ZERO;
        private long totalTareas;
        private long tareasCompletadas;
        private Long proveedorId;
    }
}
