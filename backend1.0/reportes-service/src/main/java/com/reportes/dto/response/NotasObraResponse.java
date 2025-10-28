package com.reportes.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotasObraResponse {
    private Long obraId;
    private String obraNombre;
    private String estado;
    private Long clienteId;
    private String clienteNombre;
    private String notas;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
}
