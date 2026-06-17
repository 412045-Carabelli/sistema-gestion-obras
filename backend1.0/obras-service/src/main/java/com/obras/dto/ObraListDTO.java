package com.obras.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.obras.enums.EstadoObraEnum;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ObraListDTO {
    private Long id;
    private Long id_cliente;
    private Long id_grupo;
    private EstadoObraEnum obra_estado;
    private String nombre;
    private String direccion;
    private LocalDateTime fecha_inicio;
    private LocalDateTime fecha_fin;
    private BigDecimal presupuesto;
    private Boolean requiere_factura;
    private Boolean activo;
    private Instant creado_en;
}
