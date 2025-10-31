package com.transacciones.dto;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoTransaccionDto {
    private Long id;
    private String nombre;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
