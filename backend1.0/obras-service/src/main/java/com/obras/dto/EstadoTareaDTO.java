package com.obras.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EstadoTareaDTO {
    private Long id;
    private String nombre;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
