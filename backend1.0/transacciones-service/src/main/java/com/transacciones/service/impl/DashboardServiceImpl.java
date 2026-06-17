package com.transacciones.service.impl;

import com.transacciones.service.DashboardService;
import com.transacciones.dto.DashboardCuentaCorrienteResponse;
import com.transacciones.dto.DashboardFilterRequest;
import com.transacciones.dto.TopObraFinancieroDto;
import com.transacciones.repository.DashboardRepository;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class DashboardServiceImpl implements DashboardService {

  private final DashboardRepository dashboardRepository;

  /**
   * Obtiene los KPIs de cuenta corriente del dashboard.
   * Filtra por obra, cliente, proveedor y rango de fechas (todos opcionales).
   *
   * @param filtro DTO con parámetros: obraId, clienteId, proveedorId, fechaInicio, fechaFin
   * @return DashboardCuentaCorrienteResponse con: cobrado, porCobrar, pagado, porPagar, resultado
   */
  @Override
  public DashboardCuentaCorrienteResponse obtenerCuentaCorriente(DashboardFilterRequest filtro) {
    try {
      log.debug("Obteniendo cuenta corriente del dashboard con filtros: obraId={}, clienteId={}, proveedorId={}, fechaInicio={}, fechaFin={}",
          filtro.getObraId(),
          filtro.getClienteId(),
          filtro.getProveedorId(),
          filtro.getFechaInicio(),
          filtro.getFechaFin()
      );

      return dashboardRepository.obtenerCuentaCorriente(filtro);

    } catch (Exception ex) {
      log.error("Error al obtener cuenta corriente del dashboard", ex);
      return DashboardCuentaCorrienteResponse.builder()
          .cobrado(BigDecimal.ZERO)
          .porCobrar(BigDecimal.ZERO)
          .pagado(BigDecimal.ZERO)
          .porPagar(BigDecimal.ZERO)
          .resultado(BigDecimal.ZERO)
          .build();
    }
  }

  @Override
  public List<TopObraFinancieroDto> obtenerTopObras(int topN) {
    try {
      return dashboardRepository.obtenerTopObras(topN > 0 ? topN : 10);
    } catch (Exception ex) {
      log.error("Error al obtener top obras financiero", ex);
      return Collections.emptyList();
    }
  }
}
