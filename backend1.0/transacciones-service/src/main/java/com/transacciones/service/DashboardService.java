package com.transacciones.service;

import com.transacciones.dto.DashboardCuentaCorrienteResponse;
import com.transacciones.dto.DashboardFilterRequest;

/**
 * Servicio para KPIs del dashboard.
 */
public interface DashboardService {

  /**
   * Obtiene los KPIs de cuenta corriente del dashboard con filtros opcionales.
   * Ejecuta sp_dashboard_cuenta_corriente en la base de datos.
   *
   * @param filtro DTO con parámetros opcionales: obraId, clienteId, proveedorId, fechaInicio, fechaFin
   * @return DashboardCuentaCorrienteResponse con: cobrado, porCobrar, pagado, porPagar, resultado
   */
  DashboardCuentaCorrienteResponse obtenerCuentaCorriente(DashboardFilterRequest filtro);
}
