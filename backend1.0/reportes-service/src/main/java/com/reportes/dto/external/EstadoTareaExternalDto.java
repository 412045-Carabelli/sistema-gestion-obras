package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;

@Data
public class EstadoTareaExternalDto {
    private Long id;
    private String nombre;
    private Boolean activo;
    @JsonProperty("ultima_actualizacion")
    private Instant ultimaActualizacion;
    @JsonProperty("tipo_actualizacion")
    private String tipoActualizacion;
}
