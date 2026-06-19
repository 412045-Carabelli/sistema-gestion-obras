package com.transacciones.controller;

import com.transacciones.service.DashboardService;
import com.transacciones.dto.DashboardCuentaCorrienteResponse;
import com.transacciones.dto.DashboardFilterRequest;
import com.transacciones.dto.TopObraFinancieroDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
      @RequestBody(required = false) DashboardFilterRequest filtro,
      @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {

    if (filtro == null) {
      filtro = new DashboardFilterRequest();
    }
    filtro.setOrganizacionId(organizacionId > 0 ? organizacionId : null);

    DashboardCuentaCorrienteResponse response = dashboardService.obtenerCuentaCorriente(filtro);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/graficos")
  public ResponseEntity<List<TopObraFinancieroDto>> obtenerGraficos(
      @RequestParam(defaultValue = "10") int topN) {
    return ResponseEntity.ok(dashboardService.obtenerTopObras(topN));
  }
}
