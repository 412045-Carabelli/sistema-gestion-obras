package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class RankingClientesResponse {
    private List<ItemRankingCliente> clientes = new ArrayList<>();

    @Data
    public static class ItemRankingCliente {
        private Long clienteId;
        private String clienteNombre;
        private long cantidadObras;
        private BigDecimal totalIngresos = BigDecimal.ZERO;
        private BigDecimal totalEgresos = BigDecimal.ZERO;
    }
}
