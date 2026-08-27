package com.obras.dto;

import com.obras.enums.EstadoTareaEnum;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Tarea enriquecida con nombre de obra/proveedor/gremio, para el módulo general
 * "Diagrama de Gantt" (todas las tareas activas de la organización, cruzando obras).
 */
@Data
public class TareaCronogramaResponse {
    private Long id;
    private Long id_obra;
    private String obra_nombre;
    private String obra_estado;
    private Long id_proveedor;
    private String proveedor_nombre;
    private Long gremio_id;
    private String gremio_nombre;
    private Long numero_orden;
    private EstadoTareaEnum estado_tarea;
    private String nombre;
    private String descripcion;
    private Double porcentaje;
    private LocalDateTime fecha_inicio;
    private LocalDateTime fecha_fin;
    private Instant creado_en;
}
