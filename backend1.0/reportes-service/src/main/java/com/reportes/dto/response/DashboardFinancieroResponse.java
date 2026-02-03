package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DashboardFinancieroResponse {
    private CtaCte ctaCte = new CtaCte();
    private Flujo flujo = new Flujo();

    @Data
    public static class CtaCte {
        private BigDecimal loCobrado = BigDecimal.ZERO;
        private BigDecimal porCobrar = BigDecimal.ZERO;
        private BigDecimal pagado = BigDecimal.ZERO;
        private BigDecimal porPagar = BigDecimal.ZERO;
    }

    @Data
    public static class Flujo {
        private BigDecimal ingresos = BigDecimal.ZERO;
        private BigDecimal egresos = BigDecimal.ZERO;
        private BigDecimal saldo = BigDecimal.ZERO;
    }
}
