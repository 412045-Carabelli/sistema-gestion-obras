package com.transacciones.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FlujoCajaDTO {
    private BigDecimal cobrado;           // Total cobrado
    private BigDecimal por_cobrar;        // Presupuesto - Cobrado
    private BigDecimal pagado;            // Total pagado
    private BigDecimal por_pagar;         // Costos - Pagado
    private BigDecimal resultado;         // Cobrado - Pagado (ganancia/pérdida)
    private BigDecimal presupuesto_total; // Total presupuesto (informativo)
    private BigDecimal costos_total;      // Total costos (informativo)
}
