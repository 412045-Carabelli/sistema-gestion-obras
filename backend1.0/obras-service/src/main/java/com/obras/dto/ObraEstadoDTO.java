package com.obras.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ObraEstadoDTO {
    private Long id;
    private String nombre;
    private boolean activo;
}
