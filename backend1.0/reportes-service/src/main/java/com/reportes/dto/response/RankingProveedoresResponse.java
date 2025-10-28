package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class RankingProveedoresResponse {
    private List<ItemRankingProveedor> proveedores = new ArrayList<>();

    @Data
    public static class ItemRankingProveedor {
        private Long proveedorId;
        private String proveedorNombre;
        private long cantidadObras;
        private BigDecimal totalCostos = BigDecimal.ZERO;
    }
}
