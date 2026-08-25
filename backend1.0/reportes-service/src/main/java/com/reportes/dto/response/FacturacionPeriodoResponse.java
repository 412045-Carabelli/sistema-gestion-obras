package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class FacturacionPeriodoResponse {
    private BigDecimal totalFacturado = BigDecimal.ZERO;
    private BigDecimal totalPorFacturar = BigDecimal.ZERO;
    private List<DetalleFacturacionObra> detalle = new ArrayList<>();

    @Data
    public static class DetalleFacturacionObra {
        private Long obraId;
        private String obraNombre;
        private Long clienteId;
        private String clienteNombre;
        private BigDecimal presupuesto = BigDecimal.ZERO;
        private BigDecimal facturado = BigDecimal.ZERO;
        private BigDecimal porFacturar = BigDecimal.ZERO;
    }
}
