package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
public class TareaExternalDto {
    private Long id;
    @JsonProperty("id_obra")
    private Long idObra;
    @JsonProperty("id_proveedor")
    private Long idProveedor;
    @JsonProperty("estado_tarea")
    private EstadoTareaExternalDto estadoTarea;
    private String nombre;
    private String descripcion;
    @JsonProperty("fecha_inicio")
    private LocalDateTime fechaInicio;
    @JsonProperty("fecha_fin")
    private LocalDateTime fechaFin;
    @JsonProperty("creado_en")
    private Instant creadoEn;
    private Boolean activo;
    @JsonProperty("ultima_actualizacion")
    private Instant ultimaActualizacion;
    @JsonProperty("tipo_actualizacion")
    private String tipoActualizacion;
}
