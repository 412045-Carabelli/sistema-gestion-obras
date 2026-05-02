package com.reportes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardConsolidadoResponse {

    // Presupuestos y costos
    private BigDecimal totalPresupuesto;
    private BigDecimal totalCostos;
    private BigDecimal porPresupuestar;

    // Flujo de dinero
    private BigDecimal totalCobros;
    private BigDecimal totalPagos;
    private BigDecimal saldoFlujo;

    // Pendientes
    private BigDecimal porCobrar;
    private BigDecimal porPagar;

    // Cuenta corriente consolidada
    private CuentaCorrienteConsolidada cuentaCorriente;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CuentaCorrienteConsolidada {
        private BigDecimal loCobrado;
        private BigDecimal porCobrar;
        private BigDecimal pagado;
        private BigDecimal porPagar;
    }
}
