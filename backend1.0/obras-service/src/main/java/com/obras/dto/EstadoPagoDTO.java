package com.obras.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class EstadoPagoDTO {
    private Long id;
    private String estado;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
