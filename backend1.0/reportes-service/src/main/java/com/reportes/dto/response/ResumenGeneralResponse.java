package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ResumenGeneralResponse {
    private long totalObras;
    private long totalClientes;
    private long totalProveedores;
    private BigDecimal totalIngresos = BigDecimal.ZERO;
    private BigDecimal totalEgresos = BigDecimal.ZERO;
}
