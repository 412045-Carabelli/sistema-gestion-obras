package com.common.dto.clientes;

import lombok.Data;

@Data
public class ClienteRequest {
    private String nombre;
    private String contacto;
    private String cuit;
    private String telefono;
    private String email;
    private String direccion;
    private String condicionIVA;
    private Boolean activo;
}
