package com.obras.controller;

import com.obras.service.SaldosService;
import com.obras.dto.SaldoProveedorDTO;
import com.obras.dto.SaldoClienteDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saldos")
@RequiredArgsConstructor
@Slf4j
public class SaldosController {

    private final SaldosService saldosService;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Obtiene saldos de todos los proveedores en 1 sola query (mediante SP).
     * Endpoint: GET /api/saldos/proveedores
     *
     * Respuesta:
     * [
     *   {
     *     "id": 1,
     *     "nombre": "Proveedor A",
     *     "total_costos": 5000.00,
     *     "total_pagos": 3000.00,
     *     "saldo_pendiente": 2000.00
     *   }
     * ]
     *
     * @return Lista de saldos por proveedor (optimizado, sin N+1)
     */
    @GetMapping("/proveedores")
    public ResponseEntity<List<SaldoProveedorDTO>> obtenerSaldosProveedores(
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
        return ResponseEntity.ok(saldosService.obtenerSaldosProveedores(organizacionId));
    }

    /**
     * Obtiene saldos de todos los clientes en 1 sola query (mediante SP).
     * Endpoint: GET /api/saldos/clientes
     *
     * Respuesta:
     * [
     *   {
     *     "id": 1,
     *     "nombre": "Cliente A",
     *     "total_presupuesto": 50000.00,
     *     "total_cobros": 30000.00,
     *     "saldo_pendiente": 20000.00
     *   }
     * ]
     *
     * @return Lista de saldos por cliente (optimizado, sin N+1)
     */
    @GetMapping("/clientes")
    public ResponseEntity<List<SaldoClienteDTO>> obtenerSaldosClientes(
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
        return ResponseEntity.ok(saldosService.obtenerSaldosClientes(organizacionId));
    }

    @GetMapping("/flujo-caja/presupuesto")
    public ResponseEntity<Map<String, Object>> obtenerPresupuestoTotal() {
        try {
            Map<String, Object> result = new HashMap<>();
            Object presupuesto = obtenerPresupuestoDesdeObras();
            result.put("presupuesto_total", presupuesto != null ? presupuesto : 0);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("presupuesto_total", 0));
        }
    }

    @GetMapping("/flujo-caja/costos")
    public ResponseEntity<Map<String, Object>> obtenerCostosTotal() {
        try {
            Map<String, Object> result = new HashMap<>();
            Object costos = obtenerCostosDesdeObras();
            result.put("costos_total", costos != null ? costos : 0);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("costos_total", 0));
        }
    }

    private Object obtenerPresupuestoDesdeObras() {
        // Usar EntityManager para query directa
        try {
            Object result = entityManager
                    .createNativeQuery(
                            "SELECT ISNULL(SUM(presupuesto), 0) FROM obras " +
                            "WHERE activo = 1 " +
                            "AND estado_obra IN ('Adjudicada', 'En progreso', 'Cobrada', 'Facturada', 'Facturada parcial', 'Finalizada')"
                    )
                    .getSingleResult();
            return result;
        } catch (Exception e) {
            return 0;
        }
    }

    private Object obtenerCostosDesdeObras() {
        // Usar EntityManager para query directa
        try {
            Object result = entityManager
                    .createNativeQuery(
                            "SELECT ISNULL(SUM(oc.monto), 0) FROM obra_costo oc " +
                            "INNER JOIN obras o ON oc.id_obra = o.id " +
                            "WHERE oc.activo = 1 AND o.activo = 1 " +
                            "AND o.estado_obra IN ('Adjudicada', 'En progreso', 'Cobrada', 'Facturada', 'Facturada parcial', 'Finalizada')"
                    )
                    .getSingleResult();
            log.debug("Costos totales desde obras: result = {}, type = {}", result,
                    result != null ? result.getClass().getName() : "null");
            return result;
        } catch (Exception e) {
            log.error("Error al obtener costos desde obras", e);
            return 0;
        }
    }
}
