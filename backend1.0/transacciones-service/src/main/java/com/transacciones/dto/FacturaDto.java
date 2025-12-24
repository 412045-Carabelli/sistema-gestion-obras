package com.transacciones.dto;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacturaDto {
    private Long id;
    private Long id_cliente;
    private Long id_obra;
    private Double monto;
    private Double monto_restante;
    private LocalDate fecha;
    private String nombre_archivo;
    private String path_archivo;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
