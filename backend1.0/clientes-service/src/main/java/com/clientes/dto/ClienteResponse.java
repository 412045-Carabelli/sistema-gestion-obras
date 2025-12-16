package com.clientes.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClienteResponse {
    private Long id;
    private String nombre;
    private Long idEmpresa;
    private String contacto;
    private String direccion;
    private String cuit;
    private String telefono;
    private String email;
    private String condicionIVA;
    private Boolean activo;
    private Instant creadoEn;
    private Instant ultimaActualizacion;
    private String tipoActualizacion;
    private List<ObraClienteResponse> obras;
}
