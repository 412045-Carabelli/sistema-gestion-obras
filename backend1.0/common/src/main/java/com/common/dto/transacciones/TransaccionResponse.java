package com.common.dto.transacciones;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class TransaccionResponse {
    private Long id;
    private String tipo;
    private BigDecimal monto;
    private String estado;
    private String descripcion;
    private Long obraId;
    private Long clienteId;
    private Long proveedorId;
    private Instant creadoEn;
    private Instant ultimaActualizacion;
}
