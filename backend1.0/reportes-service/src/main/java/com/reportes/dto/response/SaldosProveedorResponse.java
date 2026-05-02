package com.reportes.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SaldosProveedorResponse {
    private Long proveedorId;
    private String proveedorNombre;
    private BigDecimal totalCostos = BigDecimal.ZERO;
    private BigDecimal totalPagado = BigDecimal.ZERO;
    private BigDecimal saldo = BigDecimal.ZERO;
    private List<ObraSaldo> obras = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ObraSaldo {
        private Long obraId;
        private String nombre;
        private String estado;
        private BigDecimal presupuestado = BigDecimal.ZERO;
        private BigDecimal pagado = BigDecimal.ZERO;
        private BigDecimal saldo = BigDecimal.ZERO;
    }
}
