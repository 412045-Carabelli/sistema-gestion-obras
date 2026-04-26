package com.common.dto.obras;

import lombok.Data;
import java.time.Instant;

@Data
public class ObraResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private String estado;
    private Instant creadoEn;
    private Instant ultimaActualizacion;
}
