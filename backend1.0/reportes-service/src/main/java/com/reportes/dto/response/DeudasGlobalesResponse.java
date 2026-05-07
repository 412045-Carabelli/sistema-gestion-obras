package com.reportes.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class DeudasGlobalesResponse {
    private BigDecimal deudaClientes = BigDecimal.ZERO;
    private BigDecimal deudaProveedores = BigDecimal.ZERO;
    private List<DetalleDeudaCliente> detalleDeudaClientes = new ArrayList<>();
    private List<DetalleDeudaProveedor> detalleDeudaProveedores = new ArrayList<>();

    @Data
    public static class DetalleDeudaCliente {
        private Long grupoId;
        private String grupoNombre;
        private Long obraId;
        private String obraNombre;
        private Long clienteId;
        private String clienteNombre;
        private BigDecimal presupuesto = BigDecimal.ZERO;
        private BigDecimal cobrado = BigDecimal.ZERO;
        private BigDecimal saldo = BigDecimal.ZERO;
    }

    @Data
    public static class DetalleDeudaProveedor {
        private Long grupoId;
        private String grupoNombre;
        private Long obraId;
        private String obraNombre;
        private Long proveedorId;
        private String proveedorNombre;
        private BigDecimal presupuestado = BigDecimal.ZERO;
        private BigDecimal pagado = BigDecimal.ZERO;
        private BigDecimal saldo = BigDecimal.ZERO;
    }
}
