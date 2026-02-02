package com.reportes.controller;

import com.reportes.dto.request.EstadoObraFilterRequest;
import com.reportes.dto.request.ReportFilterRequest;
import com.reportes.dto.response.*;
import com.reportes.service.ReportesService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportesControllerTest {

    @Mock
    private ReportesService reportesService;

    private ReportesController controller;

    @BeforeEach
    void setUp() {
        controller = new ReportesController(reportesService);
    }

    @Test
    void endpoints_delegan_a_servicio() {
        ReportFilterRequest filtro = new ReportFilterRequest();
        EstadoObraFilterRequest filtroEstado = new EstadoObraFilterRequest();

        IngresosEgresosResponse ingresos = new IngresosEgresosResponse();
        EstadoFinancieroObraResponse estadoFin = new EstadoFinancieroObraResponse();
        FlujoCajaResponse flujo = new FlujoCajaResponse();
        PendientesResponse pendientes = new PendientesResponse();
        EstadoObrasResponse estadoObras = new EstadoObrasResponse();
        AvanceTareasResponse avance = new AvanceTareasResponse();
        CostosPorCategoriaResponse costos = new CostosPorCategoriaResponse();
        ComisionesFrontResponse comisionesFront = new ComisionesFrontResponse();
        ResumenGeneralResponse resumen = new ResumenGeneralResponse();
        CuentaCorrienteObraResponse cuentaObra = new CuentaCorrienteObraResponse();
        CuentaCorrienteProveedorResponse cuentaProveedor = new CuentaCorrienteProveedorResponse();
        ComisionesResponse comisionesObra = new ComisionesResponse();
        ComisionesResponse comisionesGeneral = new ComisionesResponse();
        RankingClientesResponse rankingClientes = new RankingClientesResponse();
        RankingProveedoresResponse rankingProveedores = new RankingProveedoresResponse();
        NotasObraResponse nota = new NotasObraResponse();
        List<NotasObraResponse> notas = List.of(nota);

        when(reportesService.generarIngresosEgresos(filtro)).thenReturn(ingresos);
        when(reportesService.generarEstadoFinanciero(1L)).thenReturn(estadoFin);
        when(reportesService.generarFlujoCaja(filtro)).thenReturn(flujo);
        when(reportesService.generarPendientes(filtro)).thenReturn(pendientes);
        when(reportesService.generarEstadoObras(filtroEstado)).thenReturn(estadoObras);
        when(reportesService.generarAvanceTareas(filtro)).thenReturn(avance);
        when(reportesService.generarCostosPorCategoria(filtro)).thenReturn(costos);
        when(reportesService.generarComisiones(filtro)).thenReturn(comisionesFront);
        when(reportesService.generarResumenGeneral()).thenReturn(resumen);
        when(reportesService.generarCuentaCorrientePorObra(1L)).thenReturn(cuentaObra);
        when(reportesService.generarCuentaCorrientePorProveedor(10L)).thenReturn(cuentaProveedor);
        when(reportesService.generarComisionesPorObra(1L)).thenReturn(comisionesObra);
        when(reportesService.generarComisionesGeneral()).thenReturn(comisionesGeneral);
        when(reportesService.generarRankingClientes(filtro)).thenReturn(rankingClientes);
        when(reportesService.generarRankingProveedores(filtro)).thenReturn(rankingProveedores);
        when(reportesService.generarNotasGenerales()).thenReturn(notas);
        when(reportesService.generarNotasPorObra(1L)).thenReturn(nota);

        ResponseEntity<IngresosEgresosResponse> ingresosResp = controller.ingresosEgresos(filtro);
        ResponseEntity<EstadoFinancieroObraResponse> estadoResp = controller.estadoFinanciero(1L);
        ResponseEntity<FlujoCajaResponse> flujoResp = controller.flujoCaja(filtro);
        ResponseEntity<PendientesResponse> pendientesResp = controller.pendientes(filtro);
        ResponseEntity<EstadoObrasResponse> estadoObrasResp = controller.estadoObras(filtroEstado);
        ResponseEntity<AvanceTareasResponse> avanceResp = controller.avanceTareas(filtro);
        ResponseEntity<CostosPorCategoriaResponse> costosResp = controller.costosPorCategoria(filtro);
        ResponseEntity<ComisionesFrontResponse> comisionesResp = controller.comisiones(filtro);
        ResponseEntity<ResumenGeneralResponse> resumenResp = controller.resumenGeneral();
        ResponseEntity<CuentaCorrienteObraResponse> cuentaObraResp = controller.cuentaCorrienteObra(1L);
        ResponseEntity<CuentaCorrienteProveedorResponse> cuentaProveedorResp = controller.cuentaCorrienteProveedor(10L);
        ResponseEntity<ComisionesResponse> comisionesObraResp = controller.comisionesPorObra(1L);
        ResponseEntity<ComisionesResponse> comisionesGeneralResp = controller.comisionesGeneral();
        ResponseEntity<RankingClientesResponse> rankingClientesResp = controller.rankingClientes(filtro);
        ResponseEntity<RankingProveedoresResponse> rankingProveedoresResp = controller.rankingProveedores(filtro);
        ResponseEntity<List<NotasObraResponse>> notasResp = controller.notasGenerales();
        ResponseEntity<NotasObraResponse> notaResp = controller.notasPorObra(1L);

        assertThat(ingresosResp.getBody()).isSameAs(ingresos);
        assertThat(estadoResp.getBody()).isSameAs(estadoFin);
        assertThat(flujoResp.getBody()).isSameAs(flujo);
        assertThat(pendientesResp.getBody()).isSameAs(pendientes);
        assertThat(estadoObrasResp.getBody()).isSameAs(estadoObras);
        assertThat(avanceResp.getBody()).isSameAs(avance);
        assertThat(costosResp.getBody()).isSameAs(costos);
        assertThat(comisionesResp.getBody()).isSameAs(comisionesFront);
        assertThat(resumenResp.getBody()).isSameAs(resumen);
        assertThat(cuentaObraResp.getBody()).isSameAs(cuentaObra);
        assertThat(cuentaProveedorResp.getBody()).isSameAs(cuentaProveedor);
        assertThat(comisionesObraResp.getBody()).isSameAs(comisionesObra);
        assertThat(comisionesGeneralResp.getBody()).isSameAs(comisionesGeneral);
        assertThat(rankingClientesResp.getBody()).isSameAs(rankingClientes);
        assertThat(rankingProveedoresResp.getBody()).isSameAs(rankingProveedores);
        assertThat(notasResp.getBody()).isSameAs(notas);
        assertThat(notaResp.getBody()).isSameAs(nota);
    }
}
