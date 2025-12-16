package com.clientes.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteRequest {
    @NotBlank
    private String nombre;
    private Long idEmpresa;
    private String contacto;
    private String direccion;
    private String cuit;
    private String telefono;
    private String email;
    @NotBlank
    private String condicionIVA;

    private Boolean activo;
}
