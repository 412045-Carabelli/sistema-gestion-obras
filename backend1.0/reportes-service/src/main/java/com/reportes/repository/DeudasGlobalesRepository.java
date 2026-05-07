package com.reportes.repository;

import com.reportes.dto.response.DeudasGlobalesResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
@Slf4j
public class DeudasGlobalesRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<DeudasGlobalesResponse.DetalleDeudaCliente> obtenerDeudaClientes(
            Long grupoId,
            Long obraId,
            Long clienteId,
            LocalDate fechaInicio,
            LocalDate fechaFin) {

        String sql = "EXEC [sgo_transacciones].[dbo].[sp_deudas_globales_con_grupo] ?, ?, ?, ?, ?, ?";
        List<DeudasGlobalesResponse.DetalleDeudaCliente> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_deudas_globales_con_grupo con parámetros: grupoId={}, obraId={}, clienteId={}, fechaInicio={}, fechaFin={}",
                grupoId, obraId, clienteId, fechaInicio, fechaFin);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                DeudasGlobalesResponse.DetalleDeudaCliente detalle = new DeudasGlobalesResponse.DetalleDeudaCliente();
                detalle.setGrupoId(rs.getObject("grupoId") != null ? rs.getLong("grupoId") : null);
                detalle.setGrupoNombre(rs.getString("grupoNombre"));
                detalle.setObraId(rs.getLong("obraId"));
                detalle.setObraNombre(rs.getString("obraNombre"));
                detalle.setClienteId(rs.getLong("clienteId"));
                detalle.setClienteNombre(rs.getString("clienteNombre"));
                detalle.setPresupuesto(rs.getBigDecimal("presupuesto"));
                detalle.setCobrado(rs.getBigDecimal("cobrado"));
                detalle.setSaldo(rs.getBigDecimal("saldo"));
                resultados.add(detalle);
                return null;
            },
                    grupoId,
                    obraId,
                    clienteId,
                    null, // proveedorId - no usado en este SP
                    fechaInicio != null ? Date.valueOf(fechaInicio) : null,
                    fechaFin != null ? Date.valueOf(fechaFin) : null
            );
            log.info("sp_deudas_globales_con_grupo retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_deudas_globales_con_grupo", e);
            throw e;
        }

        return resultados;
    }

    public List<DeudasGlobalesResponse.DetalleDeudaProveedor> obtenerDeudaProveedores(
            Long grupoId,
            Long obraId,
            Long proveedorId,
            LocalDate fechaInicio,
            LocalDate fechaFin) {

        String sql = "EXEC [sgo_transacciones].[dbo].[sp_deudas_proveedores_con_grupo] ?, ?, ?, ?, ?";
        List<DeudasGlobalesResponse.DetalleDeudaProveedor> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_deudas_proveedores_con_grupo con parámetros: grupoId={}, obraId={}, proveedorId={}, fechaInicio={}, fechaFin={}",
                grupoId, obraId, proveedorId, fechaInicio, fechaFin);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                DeudasGlobalesResponse.DetalleDeudaProveedor detalle = new DeudasGlobalesResponse.DetalleDeudaProveedor();
                detalle.setGrupoId(rs.getObject("grupoId") != null ? rs.getLong("grupoId") : null);
                detalle.setGrupoNombre(rs.getString("grupoNombre"));
                detalle.setObraId(rs.getLong("obraId"));
                detalle.setObraNombre(rs.getString("obraNombre"));
                detalle.setProveedorId(rs.getLong("proveedorId"));
                detalle.setProveedorNombre(rs.getString("proveedorNombre"));
                detalle.setPresupuestado(rs.getBigDecimal("presupuestado"));
                detalle.setPagado(rs.getBigDecimal("pagado"));
                detalle.setSaldo(rs.getBigDecimal("saldo"));
                resultados.add(detalle);
                return null;
            },
                    grupoId,
                    obraId,
                    proveedorId,
                    fechaInicio != null ? Date.valueOf(fechaInicio) : null,
                    fechaFin != null ? Date.valueOf(fechaFin) : null
            );
            log.info("sp_deudas_proveedores_con_grupo retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_deudas_proveedores_con_grupo", e);
            throw e;
        }

        return resultados;
    }
}
