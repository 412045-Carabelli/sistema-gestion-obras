package com.common.dto.tareas;

import lombok.Data;
import java.time.Instant;

@Data
public class TareaRequest {
    private String titulo;
    private Long obraId;
    private Long clienteId;
    private Long proveedorId;
    private String estado;
    private String descripcion;
    private Instant fechaInicio;
    private Instant fechaVencimiento;
}
