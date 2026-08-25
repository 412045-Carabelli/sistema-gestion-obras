package com.reportes.dto.external;

import lombok.Data;

import java.time.Instant;

@Data
public class TareaVencimientoExternalDto {
    private Long id;
    private String titulo;
    private Long obraId;
    private String obraNombre;
    private Long clienteId;
    private String clienteNombre;
    private Long proveedorId;
    private String proveedorNombre;
    private String estado;
    private String prioridad;
    private String descripcion;
    private Instant fechaInicio;
    private Instant fechaVencimiento;
    private Instant creadoEn;
    private Instant ultimaActualizacion;
}
