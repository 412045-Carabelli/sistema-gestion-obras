package com.obras.dto;

import com.obras.enums.EstadoPagoEnum;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class ObraCostoDTO {
    private Long id;
    private Long id_obra;
    private Long id_proveedor;
    private String descripcion;
    private String unidad;
    private BigDecimal cantidad;
    private BigDecimal precio_unitario;
    private BigDecimal beneficio;
    private BigDecimal subtotal;
    private BigDecimal total;
    private EstadoPagoEnum estado_pago;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}

