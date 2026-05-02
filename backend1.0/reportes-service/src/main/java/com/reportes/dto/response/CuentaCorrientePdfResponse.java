package com.reportes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CuentaCorrientePdfResponse {

    // Info del asociado (proveedor o cliente)
    private Long asociadoId;
    private String asociadoNombre;
    private String asociadoEmail;
    private String asociadoTelefono;

    // Totales
    private BigDecimal totalCostos;
    private BigDecimal totalPagos;
    private BigDecimal saldoFinal;

    // Fechas únicas ordenadas (para columnas del PDF)
    private List<LocalDate> fechasUnicas;

    // Filas de la tabla: una por obra
    private List<FilaObra> filas;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilaObra {
        private Long obraId;
        private String obraNombre;

        // Map de fecha → sumatoria de movimientos ese día para esta obra
        // Clave: LocalDate.toString() para ser JSON-serializable
        private Map<String, BigDecimal> movimientosPorFecha;

        // Saldo final de la obra
        private BigDecimal saldoObra;
    }
}
