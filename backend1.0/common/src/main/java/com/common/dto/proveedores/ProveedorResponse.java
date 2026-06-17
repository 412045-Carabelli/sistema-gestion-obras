package com.common.dto.proveedores;

import lombok.Data;
import java.time.Instant;

@Data
public class ProveedorResponse {
    private Long id;
    private String nombre;
    private String contacto;
    private String cuit;
    private String telefono;
    private String email;
    private String direccion;
    private Boolean activo;
    private Instant creadoEn;
    private Instant ultimaActualizacion;
}
