package com.reportes.repository;

import com.reportes.dto.response.FacturacionPeriodoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Ejecuta sp_facturacion_periodo (vive en sgo_transacciones) cross-database,
 * igual patron que DeudasGlobalesRepository.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class FacturacionPeriodoRepository {

    private final JdbcTemplate jdbcTemplate;

    @Value("${db.schema.obras:sgo_obras}")
    private String schemaObras;

    @Value("${db.schema.clientes:sgo_clientes}")
    private String schemaClientes;

    @Value("${db.schema.transacciones:sgo_transacciones}")
    private String schemaTransacciones;

    public List<FacturacionPeriodoResponse.DetalleFacturacionObra> obtenerFacturacionPeriodo(
            Long obraId,
            Long clienteId,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Long organizacionId,
            List<String> estados) {

        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_facturacion_periodo] ?, ?, ?, ?, ?, ?, ?, ?";
        List<FacturacionPeriodoResponse.DetalleFacturacionObra> resultados = new ArrayList<>();
        String estadosCsv = (estados != null && !estados.isEmpty()) ? String.join(",", estados) : null;

        try {
            log.info("Ejecutando sp_facturacion_periodo: obraId={}, clienteId={}, fechaInicio={}, fechaFin={}, organizacionId={}, estados={}",
                    obraId, clienteId, fechaInicio, fechaFin, organizacionId, estadosCsv);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                FacturacionPeriodoResponse.DetalleFacturacionObra detalle = new FacturacionPeriodoResponse.DetalleFacturacionObra();
                detalle.setObraId(rs.getLong("obraId"));
                detalle.setObraNombre(rs.getString("obraNombre"));
                detalle.setClienteId(rs.getObject("clienteId") != null ? rs.getLong("clienteId") : null);
                detalle.setClienteNombre(rs.getString("clienteNombre"));
                detalle.setPresupuesto(rs.getBigDecimal("presupuesto"));
                detalle.setFacturado(rs.getBigDecimal("facturado"));
                detalle.setPorFacturar(rs.getBigDecimal("porFacturar"));
                resultados.add(detalle);
                return null;
            },
                    obraId,
                    clienteId,
                    fechaInicio != null ? Date.valueOf(fechaInicio) : null,
                    fechaFin != null ? Date.valueOf(fechaFin) : null,
                    organizacionId,
                    schemaObras,
                    schemaClientes,
                    estadosCsv
            );
            log.info("sp_facturacion_periodo retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_facturacion_periodo", e);
            throw e;
        }

        return resultados;
    }

    /**
     * Suma total del resultado. Devuelve BigDecimal.ZERO en cero elementos.
     */
    public BigDecimal sumar(List<FacturacionPeriodoResponse.DetalleFacturacionObra> detalle,
                             java.util.function.Function<FacturacionPeriodoResponse.DetalleFacturacionObra, BigDecimal> campo) {
        return detalle.stream()
                .map(campo)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
