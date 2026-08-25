package com.reportes.dto.external;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DashboardCuentaCorrienteExternalDto {
    private BigDecimal cobrado = BigDecimal.ZERO;
    private BigDecimal porCobrar = BigDecimal.ZERO;
    private BigDecimal pagado = BigDecimal.ZERO;
    private BigDecimal porPagar = BigDecimal.ZERO;
    private BigDecimal resultado = BigDecimal.ZERO;
}
