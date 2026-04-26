package com.common.dto.transacciones;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransaccionRequest {
    private String tipo;
    private BigDecimal monto;
    private String estado;
    private String descripcion;
    private Long obraId;
    private Long clienteId;
    private Long proveedorId;
}
