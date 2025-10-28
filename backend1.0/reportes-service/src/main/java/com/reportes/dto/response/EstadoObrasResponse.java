package com.reportes.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class EstadoObrasResponse {
    private List<DetalleEstadoObra> obras = new ArrayList<>();

    @Data
    public static class DetalleEstadoObra {
        private Long obraId;
        private String obraNombre;
        private String estado;
        private Long clienteId;
        private String clienteNombre;
        private LocalDateTime fechaInicio;
        private LocalDateTime fechaFin;
        private String notas;
    }
}
