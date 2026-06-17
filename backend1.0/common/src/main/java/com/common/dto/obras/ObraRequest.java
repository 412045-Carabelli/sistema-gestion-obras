package com.common.dto.obras;

import lombok.Data;

@Data
public class ObraRequest {
    private String nombre;
    private String descripcion;
    private String estado;
}
