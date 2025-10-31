package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class CostosPorCategoriaResponse {
    private BigDecimal total = BigDecimal.ZERO;
    private List<CategoriaCosto> categorias = new ArrayList<>();

    @Data
    public static class CategoriaCosto {
        private String categoria;
        private BigDecimal total = BigDecimal.ZERO;
        private BigDecimal porcentaje = BigDecimal.ZERO;
    }
}
