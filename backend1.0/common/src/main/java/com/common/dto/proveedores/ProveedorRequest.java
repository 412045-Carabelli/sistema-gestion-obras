package com.common.dto.proveedores;

import lombok.Data;

@Data
public class ProveedorRequest {
    private String nombre;
    private String contacto;
    private String cuit;
    private String telefono;
    private String email;
    private String direccion;
    private Boolean activo;
}
