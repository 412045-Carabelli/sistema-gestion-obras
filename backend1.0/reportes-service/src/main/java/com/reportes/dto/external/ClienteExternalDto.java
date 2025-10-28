package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;

@Data
public class ClienteExternalDto {
    private Long id;
    private String nombre;
    @JsonProperty("id_empresa")
    private Long idEmpresa;
    private String contacto;
    private String cuit;
    private String telefono;
    private String email;
    private Boolean activo;
    @JsonProperty("creado_en")
    private Instant creadoEn;
    @JsonProperty("ultima_actualizacion")
    private Instant ultimaActualizacion;
    @JsonProperty("tipo_actualizacion")
    private String tipoActualizacion;
}
