package com.reportes.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardGraficosResponse {

    private List<EstadoConteoDto> distribucionEstados;
    private List<TopObraDto> topObras;
    private KpisGraficosDto kpis;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EstadoConteoDto {
        private String estado;
        private int cantidad;
        private double porcentaje;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopObraDto {
        private Long obraId;
        private String obraNombre;
        private BigDecimal presupuesto;
        private BigDecimal totalCobros;
        private BigDecimal totalPagos;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KpisGraficosDto {
        private int totalObras;
        private int obrasActivas;
        private BigDecimal presupuestoTotal;
        private BigDecimal porcentajeCobroGlobal;
    }
}
