package com.clientes.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ObraClienteResponse {
    private Long id;
    private Long id_cliente;
    private String obra_estado;
    private String nombre;
    private String direccion;
    private LocalDateTime fecha_inicio;
    private LocalDateTime fecha_fin;
    private BigDecimal presupuesto;
    private BigDecimal saldo_pendiente;
    private Boolean activo;
    private Instant creado_en;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
