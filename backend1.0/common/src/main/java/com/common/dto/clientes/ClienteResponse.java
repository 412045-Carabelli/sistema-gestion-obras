package com.common.dto.clientes;

import lombok.Data;
import java.time.Instant;

@Data
public class ClienteResponse {
    private Long id;
    private String nombre;
    private String contacto;
    private String cuit;
    private String telefono;
    private String email;
    private String direccion;
    private String condicionIVA;
    private Boolean activo;
    private Instant creadoEn;
    private Instant ultimaActualizacion;
}
