package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DeudasGlobalesResponse {
    private BigDecimal deudaClientes = BigDecimal.ZERO;
    private BigDecimal deudaProveedores = BigDecimal.ZERO;
}
