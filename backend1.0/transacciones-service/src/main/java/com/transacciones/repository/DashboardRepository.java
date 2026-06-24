package com.transacciones.repository;

import com.transacciones.dto.DashboardCuentaCorrienteResponse;
import com.transacciones.dto.DashboardFilterRequest;
import com.transacciones.dto.TopObraFinancieroDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.sql.Date;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
          "DECLARE @organizacion_id BIGINT = ?; " +
          "EXEC sp_dashboard_cuenta_corriente @obraId, @clienteId, @proveedorId, @fechaInicio, @fechaFin, @organizacion_id"
      );

      query.setParameter(1, filtro.getObraId());
      query.setParameter(2, filtro.getClienteId());
      query.setParameter(3, filtro.getProveedorId());
      query.setParameter(4, filtro.getFechaInicio() != null ? Date.valueOf(filtro.getFechaInicio()) : null);
      query.setParameter(5, filtro.getFechaFin() != null ? Date.valueOf(filtro.getFechaFin()) : null);
      query.setParameter(6, filtro.getOrganizacionId());

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
   * Obtiene top N obras ordenadas por actividad financiera (cobros + pagos).
   * Calcula directamente desde la tabla transacciones.
   *
   * @param topN cantidad máxima de resultados
   * @return lista de TopObraFinancieroDto
   */
  @SuppressWarnings("unchecked")
  public List<TopObraFinancieroDto> obtenerTopObras(int topN, Long organizacionId) {
    try {
      Query query = entityManager.createNativeQuery(
          "SELECT TOP (:topN) " +
          "  t.id_obra AS obraId, " +
          "  NULL AS obraNombre, " +
          "  NULL AS presupuesto, " +
          "  SUM(CASE WHEN UPPER(t.id_tipo_transaccion) = 'COBRO' THEN t.monto ELSE 0 END) AS totalCobros, " +
          "  SUM(CASE WHEN UPPER(t.id_tipo_transaccion) = 'PAGO' THEN t.monto ELSE 0 END) AS totalPagos " +
          "FROM transacciones t " +
          "WHERE t.activo = 1 " +
          "AND (:organizacionId = 0 OR t.organizacion_id = :organizacionId) " +
          "GROUP BY t.id_obra " +
          "ORDER BY (SUM(CASE WHEN UPPER(t.id_tipo_transaccion) = 'COBRO' THEN t.monto ELSE 0 END) + " +
          "          SUM(CASE WHEN UPPER(t.id_tipo_transaccion) = 'PAGO' THEN t.monto ELSE 0 END)) DESC"
      );
      query.setParameter("topN", topN);
      query.setParameter("organizacionId", organizacionId != null ? organizacionId : 0L);

      List<Object[]> rows = query.getResultList();
      List<TopObraFinancieroDto> result = new ArrayList<>();
      for (Object[] row : rows) {
        result.add(TopObraFinancieroDto.builder()
            .obraId(((Number) row[0]).longValue())
            .obraNombre(null)
            .presupuesto(null)
            .totalCobros(toBigDecimal(row[3]))
            .totalPagos(toBigDecimal(row[4]))
            .build());
      }
      return result;
    } catch (Exception e) {
      log.error("Error al obtener top obras financiero", e);
      return Collections.emptyList();
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
