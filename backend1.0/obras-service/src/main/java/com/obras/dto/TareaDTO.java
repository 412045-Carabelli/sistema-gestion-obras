package com.obras.dto;

import com.obras.enums.EstadoTareaEnum;
import lombok.Data;
import java.time.Instant;
import java.time.LocalDateTime;

@Data
public class TareaDTO {
    private Long id;
    private Long id_obra;
    private Long id_proveedor;
    private Long numero_orden;
    private EstadoTareaEnum estado_tarea;
    private String nombre;
    private String descripcion;
    private Double porcentaje;
    private LocalDateTime fecha_inicio;
    private LocalDateTime fecha_fin;
    private Instant creado_en;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}

