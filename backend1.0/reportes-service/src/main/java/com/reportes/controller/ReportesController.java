package com.reportes.controller;

import com.reportes.dto.request.EstadoObraFilterRequest;
import com.reportes.dto.request.ReportFilterRequest;
import com.reportes.dto.response.*;
import com.reportes.service.ReportesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReportesController {

    private final ReportesService reportesService;

    @PostMapping("/financieros/ingresos-egresos")
    public ResponseEntity<IngresosEgresosResponse> ingresosEgresos(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarIngresosEgresos(filtro));
    }

    @GetMapping("/financieros/estado-obra/{obraId}")
    public ResponseEntity<EstadoFinancieroObraResponse> estadoFinanciero(@PathVariable("obraId") Long obraId) {
        return ResponseEntity.ok(reportesService.generarEstadoFinanciero(obraId));
    }

    @PostMapping("/financieros/flujo-caja")
    public ResponseEntity<FlujoCajaResponse> flujoCaja(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarFlujoCaja(filtro));
    }

    @PostMapping("/financieros/pendientes")
    public ResponseEntity<PendientesResponse> pendientes(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarPendientes(filtro));
    }

    @PostMapping("/operativos/estado-obras")
    public ResponseEntity<EstadoObrasResponse> estadoObras(@RequestBody(required = false) EstadoObraFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarEstadoObras(filtro));
    }

    @PostMapping("/operativos/avance-tareas")
    public ResponseEntity<AvanceTareasResponse> avanceTareas(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarAvanceTareas(filtro));
    }

    @PostMapping("/operativos/costos-categoria")
    public ResponseEntity<CostosPorCategoriaResponse> costosPorCategoria(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarCostosPorCategoria(filtro));
    }

    @GetMapping("/generales/resumen")
    public ResponseEntity<ResumenGeneralResponse> resumenGeneral() {
        return ResponseEntity.ok(reportesService.generarResumenGeneral());
    }

    @GetMapping("/cuenta-corriente/obra/{obraId}")
    public ResponseEntity<CuentaCorrienteObraResponse> cuentaCorrienteObra(@PathVariable Long obraId) {
        return ResponseEntity.ok(reportesService.generarCuentaCorrientePorObra(obraId));
    }

    @GetMapping("/cuenta-corriente/proveedor/{proveedorId}")
    public ResponseEntity<CuentaCorrienteProveedorResponse> cuentaCorrienteProveedor(@PathVariable Long proveedorId) {
        return ResponseEntity.ok(reportesService.generarCuentaCorrientePorProveedor(proveedorId));
    }

    @GetMapping("/comisiones/obra/{obraId}")
    public ResponseEntity<ComisionesResponse> comisionesPorObra(@PathVariable Long obraId) {
        return ResponseEntity.ok(reportesService.generarComisionesPorObra(obraId));
    }

    @GetMapping("/comisiones/general")
    public ResponseEntity<ComisionesResponse> comisionesGeneral() {
        return ResponseEntity.ok(reportesService.generarComisionesGeneral());
    }

    @PostMapping("/generales/ranking-clientes")
    public ResponseEntity<RankingClientesResponse> rankingClientes(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarRankingClientes(filtro));
    }

    @PostMapping("/generales/ranking-proveedores")
    public ResponseEntity<RankingProveedoresResponse> rankingProveedores(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarRankingProveedores(filtro));
    }

    @GetMapping("/obras/notas")
    public ResponseEntity<List<NotasObraResponse>> notasGenerales() {
        return ResponseEntity.ok(reportesService.generarNotasGenerales());
    }

    @GetMapping("/obras/{obraId}/notas")
    public ResponseEntity<NotasObraResponse> notasPorObra(@PathVariable Long obraId) {
        return ResponseEntity.ok(reportesService.generarNotasPorObra(obraId));
    }
}
