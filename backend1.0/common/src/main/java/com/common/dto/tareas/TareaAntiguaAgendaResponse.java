package com.common.dto.tareas;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TareaAntiguaAgendaResponse {
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
