package com.transacciones.repository;

import com.transacciones.dto.DashboardCuentaCorrienteResponse;
import com.transacciones.dto.DashboardFilterRequest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.sql.Date;

/**
 * Repository que ejecuta SPs del dashboard contra sp_dashboard_cuenta_corriente.
 */
@Repository
@Slf4j
public class DashboardRepository {

  @PersistenceContext
  private EntityManager entityManager;

  /**
   * Obtiene los KPIs de cuenta corriente del dashboard.
   * Ejecuta sp_dashboard_cuenta_corriente con filtros opcionales.
   *
   * @param filtro DTO con parámetros opcionales: obraId, clienteId, proveedorId, fechaInicio, fechaFin
   * @return DashboardCuentaCorrienteResponse con: cobrado, porCobrar, pagado, porPagar, resultado
   */
  public DashboardCuentaCorrienteResponse obtenerCuentaCorriente(DashboardFilterRequest filtro) {
    try {
      log.debug("Ejecutando sp_dashboard_cuenta_corriente con filtros: {}", filtro);

      Query query = entityManager.createNativeQuery(
          "DECLARE @obraId BIGINT = ?; " +
          "DECLARE @clienteId BIGINT = ?; " +
          "DECLARE @proveedorId BIGINT = ?; " +
          "DECLARE @fechaInicio DATE = ?; " +
          "DECLARE @fechaFin DATE = ?; " +
          "EXEC sp_dashboard_cuenta_corriente @obraId, @clienteId, @proveedorId, @fechaInicio, @fechaFin"
      );

      query.setParameter(1, filtro.getObraId());
      query.setParameter(2, filtro.getClienteId());
      query.setParameter(3, filtro.getProveedorId());
      query.setParameter(4, filtro.getFechaInicio() != null ? Date.valueOf(filtro.getFechaInicio()) : null);
      query.setParameter(5, filtro.getFechaFin() != null ? Date.valueOf(filtro.getFechaFin()) : null);

      @SuppressWarnings("unchecked")
      Object[] resultado = (Object[]) query.getSingleResult();

      DashboardCuentaCorrienteResponse response = DashboardCuentaCorrienteResponse.builder()
          .cobrado(toBigDecimal(resultado[0]))
          .porCobrar(toBigDecimal(resultado[1]))
          .pagado(toBigDecimal(resultado[2]))
          .porPagar(toBigDecimal(resultado[3]))
          .resultado(toBigDecimal(resultado[4]))
          .build();

      log.info("CuentaCorriente dashboard calculada: cobrado={}, pagado={}, resultado={}",
          response.getCobrado(), response.getPagado(), response.getResultado());

      return response;

    } catch (Exception e) {
      log.error("Error al ejecutar sp_dashboard_cuenta_corriente", e);
      // Devolver estructura válida aunque esté vacía
      return DashboardCuentaCorrienteResponse.builder()
          .cobrado(BigDecimal.ZERO)
          .porCobrar(BigDecimal.ZERO)
          .pagado(BigDecimal.ZERO)
          .porPagar(BigDecimal.ZERO)
          .resultado(BigDecimal.ZERO)
          .build();
    }
  }

  /**
   * Convierte valores del SP a BigDecimal.
   */
  private BigDecimal toBigDecimal(Object value) {
    if (value == null) {
      return BigDecimal.ZERO;
    }
    if (value instanceof BigDecimal) {
      return (BigDecimal) value;
    }
    if (value instanceof Double) {
      return BigDecimal.valueOf((Double) value);
    }
    if (value instanceof Integer) {
      return BigDecimal.valueOf(((Integer) value).longValue());
    }
    if (value instanceof Long) {
      return BigDecimal.valueOf((Long) value);
    }
    return BigDecimal.ZERO;
  }
}
