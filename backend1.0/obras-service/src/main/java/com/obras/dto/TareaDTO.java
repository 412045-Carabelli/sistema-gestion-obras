package com.obras.dto;

import com.obras.entity.EstadoTarea;
import lombok.Data;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TareaDTO {
    private Long id;
    private Long id_obra;
    private Long id_proveedor;
    private EstadoTareaDTO estado_tarea;
    private String nombre;
    private String descripcion;
}


