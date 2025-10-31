package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class PendientesResponse {
    private List<Pendiente> pendientes = new ArrayList<>();

    @Data
    public static class Pendiente {
        private Long obraId;
        private String obraNombre;
        private Long proveedorId;
        private String proveedorNombre;
        private String estadoPago;
        private BigDecimal total = BigDecimal.ZERO;
        private String descripcion;
    }
}
