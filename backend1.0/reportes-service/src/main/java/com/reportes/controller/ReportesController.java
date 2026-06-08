package com.reportes.controller;

import com.reportes.dto.request.EstadoObraFilterRequest;
import com.reportes.dto.request.ReportFilterRequest;
import com.reportes.dto.response.*;
import com.reportes.dto.response.FiltroResponse;
import com.reportes.repository.DeudasGlobalesRepository;
import com.reportes.service.ReportesService;
import com.reportes.service.ReportesProveedoresService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReportesController {

    private final ReportesService reportesService;
    private final ReportesProveedoresService proveedoresService;

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

    @PostMapping("/financieros/dashboard")
    public ResponseEntity<DashboardFinancieroResponse> dashboardFinanciero(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarDashboardFinanciero(filtro));
    }

    @PostMapping("/financieros/dashboard-consolidado")
    public ResponseEntity<DashboardConsolidadoResponse> dashboardConsolidado(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarDashboardConsolidado(filtro));
    }

    @PostMapping("/financieros/deudas-globales")
    public ResponseEntity<DeudasGlobalesResponse> deudasGlobales(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarDeudasGlobales(filtro));
    }

    @PostMapping("/financieros/cuentas-corrientes-combinadas")
    public ResponseEntity<CuentasCorrientesCombindasResponse> cuentasCorrientesCombinadas(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarCuentasCorrientesCombinadas(filtro));
    }

    @PostMapping("/financieros/cuenta-corriente-obra-global")
    public ResponseEntity<CuentaCorrienteObraResponse> cuentaCorrienteObraGlobal(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarCuentaCorrienteObraGlobal(filtro));
    }

    @PostMapping("/financieros/cuenta-corriente-proveedor-global")
    public ResponseEntity<CuentaCorrienteProveedorResponse> cuentaCorrienteProveedorGlobal(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarCuentaCorrienteProveedorGlobal(filtro));
    }

    @PostMapping("/financieros/cuenta-corriente-cliente")
    public ResponseEntity<CuentaCorrienteClienteResponse> cuentaCorrienteCliente(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarCuentaCorrienteCliente(filtro));
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

    @GetMapping("/operativos/avance-pagos-obra/{obraId}")
    public ResponseEntity<AvancePagosObraResponse> avancePagosObra(@PathVariable("obraId") Long obraId) {
        return ResponseEntity.ok(reportesService.generarAvancePagosObra(obraId));
    }

    @PostMapping("/operativos/costos-categoria")
    public ResponseEntity<CostosPorCategoriaResponse> costosPorCategoria(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarCostosPorCategoria(filtro));
    }

    @PostMapping("/financieros/comisiones")
    public ResponseEntity<ComisionesFrontResponse> comisiones(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarComisiones(filtro));
    }

    @GetMapping("/generales/resumen")
    public ResponseEntity<ResumenGeneralResponse> resumenGeneral() {
        return ResponseEntity.ok(reportesService.generarResumenGeneral());
    }

    @GetMapping("/cuenta-corriente/obra/{obraId}")
    public ResponseEntity<CuentaCorrienteObraResponse> cuentaCorrienteObra(@PathVariable("obraId") Long obraId) {
        return ResponseEntity.ok(reportesService.generarCuentaCorrientePorObra(obraId));
    }

    @GetMapping("/cuenta-corriente/proveedor/{proveedorId}")
    public ResponseEntity<CuentaCorrienteProveedorResponse> cuentaCorrienteProveedor(@PathVariable("proveedorId") Long proveedorId) {
        return ResponseEntity.ok(reportesService.generarCuentaCorrientePorProveedor(proveedorId));
    }

    @GetMapping("/cuenta-corriente/proveedores")
    public ResponseEntity<List<CuentaCorrienteProveedorResponse>> cuentaCorrienteProveedores() {
        return ResponseEntity.ok(reportesService.generarCuentaCorrienteProveedores());
    }

    @GetMapping("/comisiones/obra/{obraId}")
    public ResponseEntity<ComisionesResponse> comisionesPorObra(@PathVariable("obraId") Long obraId) {
        return ResponseEntity.ok(reportesService.generarComisionesPorObra(obraId));
    }

    @GetMapping("/comisiones/general")
    public ResponseEntity<ComisionesResponse> comisionesGeneral() {
        return ResponseEntity.ok(reportesService.generarComisionesGeneral());
    }

    // Filtros en cascada para deudas globales
    @GetMapping("/filtros/obras-por-cliente")
    public ResponseEntity<List<FiltroResponse>> obtenerObrasPorCliente(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long proveedorId,
            @RequestParam(required = false) Long obraId) {
        return ResponseEntity.ok(reportesService.obtenerObrasPorCliente(clienteId, proveedorId, obraId));
    }

    @GetMapping("/filtros/proveedores-por-cliente")
    public ResponseEntity<List<FiltroResponse>> obtenerProveedoresPorCliente(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long proveedorId,
            @RequestParam(required = false) Long obraId) {
        return ResponseEntity.ok(reportesService.obtenerProveedoresPorCliente(clienteId, proveedorId, obraId));
    }

    @GetMapping("/filtros/obras-por-proveedor")
    public ResponseEntity<List<FiltroResponse>> obtenerObrasPorProveedor(
            @RequestParam(required = false) Long proveedorId,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long obraId) {
        return ResponseEntity.ok(reportesService.obtenerObrasPorProveedor(proveedorId, clienteId, obraId));
    }

    @GetMapping("/filtros/clientes-por-proveedor")
    public ResponseEntity<List<FiltroResponse>> obtenerClientesPorProveedor(
            @RequestParam(required = false) Long proveedorId,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long obraId) {
        return ResponseEntity.ok(reportesService.obtenerClientesPorProveedor(proveedorId, clienteId, obraId));
    }

    @GetMapping("/filtros/proveedores-por-obra")
    public ResponseEntity<List<FiltroResponse>> obtenerProveedoresPorObra(
            @RequestParam(required = false) Long obraId,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long proveedorId) {
        return ResponseEntity.ok(reportesService.obtenerProveedoresPorObra(obraId, clienteId, proveedorId));
    }

    @GetMapping("/filtros/clientes-por-obra")
    public ResponseEntity<List<FiltroResponse>> obtenerClientesPorObra(
            @RequestParam(required = false) Long obraId,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long proveedorId) {
        return ResponseEntity.ok(reportesService.obtenerClientesPorObra(obraId, clienteId, proveedorId));
    }

    @PostMapping("/cuenta-corriente-pdf/proveedor/{proveedorId}")
    public ResponseEntity<byte[]> cuentaCorrientePdfProveedor(
            @PathVariable("proveedorId") Long proveedorId,
            @RequestParam(required = false) List<Long> obraIds) {
        try {
            byte[] pdfBytes = reportesService.generarCuentaCorrienteProveedorPdfBinario(proveedorId, obraIds);
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .header("Content-Disposition", "attachment; filename=CtaCte_Proveedor_" + proveedorId + ".pdf")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/cuenta-corriente-pdf/cliente/{clienteId}")
    public ResponseEntity<byte[]> cuentaCorrientePdfCliente(
            @PathVariable("clienteId") Long clienteId,
            @RequestParam(required = false) List<Long> obraIds) {
        try {
            byte[] pdfBytes = reportesService.generarCuentaCorrienteClientePdfBinario(clienteId, obraIds);
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .header("Content-Disposition", "attachment; filename=CtaCte_Cliente_" + clienteId + ".pdf")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/financieros/cuentas-corrientes-combinadas-pdf")
    public ResponseEntity<byte[]> cuentasCorrientesCombinaidasPdf(
            @RequestBody(required = false) ReportFilterRequest filtro) {
        try {
            byte[] pdfBytes = reportesService.generarCuentasCorrientesCombinaidasPdfBinario(filtro);
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .header("Content-Disposition", "attachment; filename=CuentasCorrientesCombinadas.pdf")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
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

    @PostMapping("/financieros/kpi-facturas")
    public ResponseEntity<FacturasKpiResponse> kpiFacturas(@RequestBody(required = false) ReportFilterRequest filtro) {
        return ResponseEntity.ok(reportesService.generarKpiFacturas(filtro));
    }

    @GetMapping("/financieros/saldos/cliente/{clienteId}")
    public ResponseEntity<SaldosClienteResponse> saldosCliente(@PathVariable("clienteId") Long clienteId) {
        return ResponseEntity.ok(reportesService.generarSaldosCliente(clienteId));
    }

    @GetMapping("/financieros/saldos/proveedor/{proveedorId}")
    public ResponseEntity<SaldosProveedorResponse> saldosProveedor(@PathVariable("proveedorId") Long proveedorId) {
        return ResponseEntity.ok(reportesService.generarSaldosProveedor(proveedorId));
    }

    @GetMapping("/financieros/saldos/proveedores")
    public ResponseEntity<List<ProveedorSaldoResponse>> saldosProveedores() {
        return ResponseEntity.ok(proveedoresService.obtenerSaldosProveedores());
    }
}
