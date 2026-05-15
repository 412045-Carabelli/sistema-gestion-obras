package com.obras.dto;

import com.obras.enums.EstadoTareaEnum;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.Instant;
import java.time.LocalDateTime;

@Data
public class TareaDTO {
    private Long id;

    @NotNull(message = "Obra requerida")
    private Long id_obra;

    private Long id_proveedor;
    private Long numero_orden;
    private EstadoTareaEnum estado_tarea;

    @NotBlank(message = "Nombre requerido")
    @Size(min = 3, max = 255, message = "Nombre debe tener entre 3 y 255 caracteres")
    private String nombre;

    private String descripcion;

    @DecimalMin(value = "0")
    @DecimalMax(value = "100", message = "Porcentaje no puede ser mayor a 100")
    private Double porcentaje;

    private LocalDateTime fecha_inicio;
    private LocalDateTime fecha_fin;
    private Instant creado_en;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}

