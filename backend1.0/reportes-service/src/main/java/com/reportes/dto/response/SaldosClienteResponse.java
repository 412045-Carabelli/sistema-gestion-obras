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
public class SaldosClienteResponse {
    private Long clienteId;
    private String clienteNombre;
    private BigDecimal totalPresupuestado = BigDecimal.ZERO;
    private BigDecimal totalCobrado = BigDecimal.ZERO;
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
        private BigDecimal cobrado = BigDecimal.ZERO;
        private BigDecimal saldo = BigDecimal.ZERO;
    }
}
