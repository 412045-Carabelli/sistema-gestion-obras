package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;

@Data
public class ProveedorExternalDto {
    private Long id;
    private String nombre;
    @JsonProperty("tipo_proveedor")
    private TipoProveedorExternalDto tipoProveedor;
    private String contacto;
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
