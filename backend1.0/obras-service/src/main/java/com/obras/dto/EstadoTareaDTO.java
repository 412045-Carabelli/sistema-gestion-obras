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

    public EstadoTareaDTO(Long id, String nombre) {
        this.id = id;
        this.nombre = nombre;
    }
}
