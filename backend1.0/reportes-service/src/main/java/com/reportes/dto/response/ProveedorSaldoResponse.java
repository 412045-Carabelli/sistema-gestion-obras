package com.reportes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProveedorSaldoResponse {
    private Long id;
    private String nombre;
    private BigDecimal totalCostos;
    private BigDecimal totalPagos;
    private BigDecimal saldoPendiente;
}
