package com.transacciones.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO de respuesta para los KPIs de cuenta corriente del dashboard.
 * Devuelto por sp_dashboard_cuenta_corriente con filtros opcionales.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardCuentaCorrienteResponse {

  /**
   * Total cobrado (SUM transacciones COBRO)
   */
  private BigDecimal cobrado;

  /**
   * Por cobrar (presupuesto_total - cobrado, mín 0)
   */
  private BigDecimal porCobrar;

  /**
   * Total pagado (SUM transacciones PAGO)
   */
  private BigDecimal pagado;

  /**
   * Por pagar (costos_total - pagado, mín 0)
   */
  private BigDecimal porPagar;

  /**
   * Resultado neto (cobrado - pagado)
   */
  private BigDecimal resultado;
}
