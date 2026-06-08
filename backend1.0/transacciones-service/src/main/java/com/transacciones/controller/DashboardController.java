package com.transacciones.controller;

import com.transacciones.service.DashboardService;
import com.transacciones.dto.DashboardCuentaCorrienteResponse;
import com.transacciones.dto.DashboardFilterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller para los KPIs del dashboard.
 * Endpoints para obtener datos financieros de la pantalla principal.
 */
@RestController
@RequestMapping("/api/transacciones/dashboard")
@RequiredArgsConstructor
public class DashboardController {

  private final DashboardService dashboardService;

  /**
   * Obtiene los KPIs de cuenta corriente del dashboard.
   * Soporta filtros opcionales por obra, cliente, proveedor y rango de fechas.
   *
   * Ejemplo de body:
   * {
   *   "obraId": null,
   *   "clienteId": null,
   *   "proveedorId": null,
   *   "fechaInicio": "2025-01-01",
   *   "fechaFin": "2025-12-31"
   * }
   *
   * Respuesta:
   * {
   *   "cobrado": 150000.00,
   *   "porCobrar": 50000.00,
   *   "pagado": 120000.00,
   *   "porPagar": 30000.00,
   *   "resultado": 30000.00
   * }
   *
   * @param filtro DTO con filtros opcionales
   * @return DashboardCuentaCorrienteResponse con los 5 KPIs
   */
  @PostMapping("/cuenta-corriente")
  public ResponseEntity<DashboardCuentaCorrienteResponse> obtenerCuentaCorriente(
      @RequestBody(required = false) DashboardFilterRequest filtro) {

    // Si no viene filtro en el body, crear uno vacío (sin filtros)
    if (filtro == null) {
      filtro = new DashboardFilterRequest();
    }

    DashboardCuentaCorrienteResponse response = dashboardService.obtenerCuentaCorriente(filtro);
    return ResponseEntity.ok(response);
  }
}
