package com.obras.dto;

import lombok.Data;

import java.math.BigDecimal;

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
    private Long id_estado_pago;
    private Boolean activo;
}

