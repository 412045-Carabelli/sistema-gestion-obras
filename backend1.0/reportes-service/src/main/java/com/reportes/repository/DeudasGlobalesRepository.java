package com.reportes.repository;

import com.reportes.dto.response.DeudasGlobalesResponse;
import com.reportes.dto.response.FiltroResponse;
import jakarta.annotation.PostConstruct;
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

@Repository
@RequiredArgsConstructor
@Slf4j
public class DeudasGlobalesRepository {

    private final JdbcTemplate jdbcTemplate;

    // Nombres reales de las bases de cada servicio: en dev llevan sufijo _test
    // (sgo_obras_test, etc.), en prod (Docker) no. Antes estaban hardcodeados a los
    // nombres de PRODUCCION dentro de los SPs, asi que en dev estos filtros leian
    // datos de produccion en vez de la base de test de cada servicio.
    @Value("${db.schema.obras:sgo_obras}")
    private String schemaObras;

    @Value("${db.schema.clientes:sgo_clientes}")
    private String schemaClientes;

    @Value("${db.schema.proveedores:sgo_proveedores}")
    private String schemaProveedores;

    @Value("${db.schema.transacciones:sgo_transacciones}")
    private String schemaTransacciones;

    @PostConstruct
    void logSchemasEnUso() {
        log.info(">>> DeudasGlobalesRepository: schemas cross-database obras='{}' clientes='{}' proveedores='{}' transacciones='{}'",
                schemaObras, schemaClientes, schemaProveedores, schemaTransacciones);
    }

    public List<DeudasGlobalesResponse.DetalleDeudaCliente> obtenerDeudaClientes(
            Long grupoId,
            Long obraId,
            Long clienteId,
            Long proveedorId,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Long organizacionId) {

        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_deudas_globales_con_grupo] ?, ?, ?, ?, ?, ?, ?, ?, ?, ?";
        List<DeudasGlobalesResponse.DetalleDeudaCliente> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_deudas_globales_con_grupo con parámetros: grupoId={}, obraId={}, clienteId={}, proveedorId={}, fechaInicio={}, fechaFin={}, organizacionId={}",
                grupoId, obraId, clienteId, proveedorId, fechaInicio, fechaFin, organizacionId);
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
                    proveedorId,
                    fechaInicio != null ? Date.valueOf(fechaInicio) : null,
                    fechaFin != null ? Date.valueOf(fechaFin) : null,
                    organizacionId,
                    schemaObras,
                    schemaClientes,
                    schemaTransacciones
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
            Long clienteId,
            Long obraId,
            Long proveedorId,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Long organizacionId) {

        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_deudas_proveedores_con_grupo] @grupoId=?, @obraId=?, @proveedorId=?, @fechaInicio=?, @fechaFin=?, @organizacion_id=?, @schemaObras=?, @schemaProveedores=?, @schemaTransacciones=?";
        List<DeudasGlobalesResponse.DetalleDeudaProveedor> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_deudas_proveedores_con_grupo con parámetros: grupoId={}, clienteId={}, obraId={}, proveedorId={}, fechaInicio={}, fechaFin={}, organizacionId={}",
                grupoId, clienteId, obraId, proveedorId, fechaInicio, fechaFin, organizacionId);
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
                    fechaFin != null ? Date.valueOf(fechaFin) : null,
                    organizacionId,
                    schemaObras,
                    schemaProveedores,
                    schemaTransacciones
            );
            log.info("sp_deudas_proveedores_con_grupo retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_deudas_proveedores_con_grupo", e);
            throw e;
        }

        return resultados;
    }

    // Filtros en cascada para deudas

    public List<FiltroResponse> obtenerObrasPorCliente(Long clienteId, Long proveedorId, Long obraId) {
        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_obtener_obras_por_cliente] ?, ?, ?, ?";
        List<FiltroResponse> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_obtener_obras_por_cliente: clienteId={}, proveedorId={}, obraId={}", clienteId, proveedorId, obraId);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                FiltroResponse resp = new FiltroResponse(rs.getLong("id"), rs.getString("nombre"));
                resultados.add(resp);
                return null;
            }, clienteId, proveedorId, obraId, schemaObras);
            log.info("sp_obtener_obras_por_cliente retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_obtener_obras_por_cliente", e);
            throw e;
        }

        return resultados;
    }

    public List<FiltroResponse> obtenerProveedoresPorCliente(Long clienteId, Long proveedorId, Long obraId) {
        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_obtener_proveedores_por_cliente] ?, ?, ?, ?, ?";
        List<FiltroResponse> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_obtener_proveedores_por_cliente: clienteId={}, proveedorId={}, obraId={}", clienteId, proveedorId, obraId);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                FiltroResponse resp = new FiltroResponse(rs.getLong("id"), rs.getString("nombre"));
                resultados.add(resp);
                return null;
            }, clienteId, proveedorId, obraId, schemaObras, schemaProveedores);
            log.info("sp_obtener_proveedores_por_cliente retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_obtener_proveedores_por_cliente", e);
            throw e;
        }

        return resultados;
    }

    public List<FiltroResponse> obtenerObrasPorProveedor(Long proveedorId, Long clienteId, Long obraId) {
        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_obtener_obras_por_proveedor] ?, ?, ?, ?, ?";
        List<FiltroResponse> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_obtener_obras_por_proveedor: proveedorId={}, clienteId={}, obraId={}", proveedorId, clienteId, obraId);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                FiltroResponse resp = new FiltroResponse(rs.getLong("id"), rs.getString("nombre"));
                resultados.add(resp);
                return null;
            }, proveedorId, clienteId, obraId, schemaObras, schemaClientes);
            log.info("sp_obtener_obras_por_proveedor retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_obtener_obras_por_proveedor", e);
            throw e;
        }

        return resultados;
    }

    public List<FiltroResponse> obtenerClientesPorProveedor(Long proveedorId, Long clienteId, Long obraId) {
        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_obtener_clientes_por_proveedor] ?, ?, ?, ?, ?";
        List<FiltroResponse> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_obtener_clientes_por_proveedor: proveedorId={}, clienteId={}, obraId={}", proveedorId, clienteId, obraId);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                FiltroResponse resp = new FiltroResponse(rs.getLong("id"), rs.getString("nombre"));
                resultados.add(resp);
                return null;
            }, proveedorId, clienteId, obraId, schemaObras, schemaClientes);
            log.info("sp_obtener_clientes_por_proveedor retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_obtener_clientes_por_proveedor", e);
            throw e;
        }

        return resultados;
    }

    public List<FiltroResponse> obtenerProveedoresPorObra(Long obraId, Long clienteId, Long proveedorId) {
        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_obtener_proveedores_por_obra] ?, ?, ?, ?, ?";
        List<FiltroResponse> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_obtener_proveedores_por_obra: obraId={}, clienteId={}, proveedorId={}", obraId, clienteId, proveedorId);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                FiltroResponse resp = new FiltroResponse(rs.getLong("id"), rs.getString("nombre"));
                resultados.add(resp);
                return null;
            }, obraId, clienteId, proveedorId, schemaObras, schemaProveedores);
            log.info("sp_obtener_proveedores_por_obra retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_obtener_proveedores_por_obra", e);
            throw e;
        }

        return resultados;
    }

    public List<FiltroResponse> obtenerClientesPorObra(Long obraId, Long clienteId, Long proveedorId) {
        String sql = "EXEC [" + schemaTransacciones + "].[dbo].[sp_obtener_clientes_por_obra] ?, ?, ?, ?, ?";
        List<FiltroResponse> resultados = new ArrayList<>();

        try {
            log.info("Ejecutando sp_obtener_clientes_por_obra: obraId={}, clienteId={}, proveedorId={}", obraId, clienteId, proveedorId);
            jdbcTemplate.query(sql, (rs, rowNum) -> {
                FiltroResponse resp = new FiltroResponse(rs.getLong("id"), rs.getString("nombre"));
                resultados.add(resp);
                return null;
            }, obraId, clienteId, proveedorId, schemaObras, schemaClientes);
            log.info("sp_obtener_clientes_por_obra retornó {} registros", resultados.size());
        } catch (Exception e) {
            log.error("Error ejecutando sp_obtener_clientes_por_obra", e);
            throw e;
        }

        return resultados;
    }

}
