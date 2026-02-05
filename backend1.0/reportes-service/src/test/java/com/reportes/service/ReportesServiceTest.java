package com.reportes.service;

import com.reportes.client.ClientesClient;
import com.reportes.client.ObrasClient;
import com.reportes.client.ProveedoresClient;
import com.reportes.client.TransaccionesClient;
import com.reportes.dto.external.*;
import com.reportes.dto.request.EstadoObraFilterRequest;
import com.reportes.dto.request.ReportFilterRequest;
import com.reportes.dto.response.*;
import com.reportes.entity.Comision;
import com.reportes.repository.ComisionRepository;
import com.reportes.repository.MovimientoReporteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportesServiceTest {

    @Mock
    private ObrasClient obrasClient;
    @Mock
    private TransaccionesClient transaccionesClient;
    @Mock
    private ClientesClient clientesClient;
    @Mock
    private ProveedoresClient proveedoresClient;
    @Mock
    private ComisionRepository comisionRepository;
    @Mock
    private MovimientoReporteRepository movimientoReporteRepository;

    @InjectMocks
    private ReportesService reportesService;

    private ObraExternalDto obra1;
    private ObraExternalDto obra2;
    private ObraExternalDto obraInactiva;
    private ClienteExternalDto cliente1;
    private ClienteExternalDto cliente2;
    private ProveedorExternalDto proveedor1;
    private ProveedorExternalDto proveedor2;
    private EstadoPagoExternalDto estadoPendiente;
    private EstadoPagoExternalDto estadoPagado;
    private List<TransaccionExternalDto> transacciones;
    private List<ObraCostoExternalDto> costosObra1;
    private List<ObraCostoExternalDto> costosObra2;

    @BeforeEach
    void setUp() {
        cliente1 = new ClienteExternalDto();
        cliente1.setId(100L);
        cliente1.setNombre("Cliente A");

        cliente2 = new ClienteExternalDto();
        cliente2.setId(101L);
        cliente2.setNombre("Cliente B");

        obra1 = new ObraExternalDto();
        obra1.setId(1L);
        obra1.setIdCliente(100L);
        obra1.setNombre("Obra A");
        obra1.setObraEstado("EN_PROGRESO");
        obra1.setPresupuesto(new BigDecimal("1000"));
        obra1.setComision(new BigDecimal("10"));
        obra1.setTieneComision(true);
        obra1.setComisionMonto(new BigDecimal("100.00"));
        obra1.setActivo(true);
        obra1.setFechaInicio(LocalDateTime.of(2024, 1, 10, 0, 0));
        obra1.setNotas("Nota A");

        obra2 = new ObraExternalDto();
        obra2.setId(2L);
        obra2.setIdCliente(101L);
        obra2.setNombre("Obra B");
        obra2.setObraEstado("FINALIZADA");
        obra2.setPresupuesto(new BigDecimal("500"));
        obra2.setComision(new BigDecimal("5"));
        obra2.setTieneComision(true);
        obra2.setComisionMonto(new BigDecimal("25.00"));
        obra2.setActivo(true);
        obra2.setFechaInicio(LocalDateTime.of(2024, 2, 1, 0, 0));

        obraInactiva = new ObraExternalDto();
        obraInactiva.setId(3L);
        obraInactiva.setActivo(false);

        TipoProveedorExternalDto tipoProveedor = new TipoProveedorExternalDto();
        tipoProveedor.setNombre("Materiales");

        proveedor1 = new ProveedorExternalDto();
        proveedor1.setId(10L);
        proveedor1.setNombre("Proveedor A");
        proveedor1.setTipoProveedor(tipoProveedor);

        proveedor2 = new ProveedorExternalDto();
        proveedor2.setId(11L);
        proveedor2.setNombre("Proveedor B");

        estadoPendiente = new EstadoPagoExternalDto();
        estadoPendiente.setId(1L);
        estadoPendiente.setEstado("PENDIENTE");

        estadoPagado = new EstadoPagoExternalDto();
        estadoPagado.setId(2L);
        estadoPagado.setEstado("PAGADO");

        ObraCostoExternalDto costo1 = new ObraCostoExternalDto();
        costo1.setId(1L);
        costo1.setIdObra(1L);
        costo1.setIdProveedor(10L);
        costo1.setDescripcion("Cemento");
        costo1.setSubtotal(new BigDecimal("100"));
        costo1.setTotal(new BigDecimal("100"));
        costo1.setActivo(true);
        costo1.setIdEstadoPago(1L);

        ObraCostoExternalDto costo2 = new ObraCostoExternalDto();
        costo2.setId(2L);
        costo2.setIdObra(1L);
        costo2.setIdProveedor(11L);
        costo2.setDescripcion("Pintura");
        costo2.setTotal(new BigDecimal("150"));
        costo2.setActivo(true);
        costo2.setIdEstadoPago(2L);

        ObraCostoExternalDto costo3 = new ObraCostoExternalDto();
        costo3.setId(3L);
        costo3.setIdObra(1L);
        costo3.setIdProveedor(10L);
        costo3.setTotal(new BigDecimal("50"));
        costo3.setActivo(false);

        ObraCostoExternalDto costo4 = new ObraCostoExternalDto();
        costo4.setId(4L);
        costo4.setIdObra(2L);
        costo4.setIdProveedor(10L);
        costo4.setDescripcion("Arena");
        costo4.setCantidad(new BigDecimal("2"));
        costo4.setPrecioUnitario(new BigDecimal("30"));
        costo4.setActivo(true);
        costo4.setIdEstadoPago(1L);

        costosObra1 = List.of(costo1, costo2, costo3);
        costosObra2 = List.of(costo4);

        transacciones = List.of(
                transaccion(1L, 1L, "COBRO", 200d, true, LocalDate.of(2024, 1, 15), null, null),
                transaccion(2L, 1L, "PAGO", 50d, true, LocalDate.of(2024, 1, 20), "PROVEEDOR", 10L),
                transaccion(3L, 2L, "COBRO", 300d, true, LocalDate.of(2024, 2, 10), null, null),
                transaccion(4L, 1L, "PAGO", 80d, true, LocalDate.of(2024, 1, 25), "PROVEEDOR", 11L),
                transaccion(5L, 1L, "COBRO", 999d, false, LocalDate.of(2024, 1, 30), null, null)
        );
    }

    @Test
    void generarIngresosEgresos_conProveedor_sumaCostosYFiltraPagos() {
        ReportFilterRequest filtro = new ReportFilterRequest();
        filtro.setProveedorId(10L);

        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2, obraInactiva));
        when(clientesClient.obtenerClientes()).thenReturn(List.of(cliente1, cliente2));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(transacciones);
        when(obrasClient.obtenerCostos(1L)).thenReturn(costosObra1);
        when(obrasClient.obtenerCostos(2L)).thenReturn(costosObra2);

        IngresosEgresosResponse response = reportesService.generarIngresosEgresos(filtro);

        assertThat(response.getTotalIngresos()).isEqualByComparingTo("500");
        assertThat(response.getTotalEgresos()).isEqualByComparingTo("210");
        assertThat(response.getDetallePorObra()).hasSize(2);
    }

    @Test
    void generarEstadoFinanciero_obraNoEncontrada() {
        when(obrasClient.obtenerObra(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportesService.generarEstadoFinanciero(99L))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("Obra no encontrada");
    }

    @Test
    void generarFlujoCaja_sinProveedor() {
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(transacciones);

        FlujoCajaResponse response = reportesService.generarFlujoCaja(new ReportFilterRequest());

        assertThat(response.getTotalIngresos()).isEqualByComparingTo("500");
        assertThat(response.getTotalEgresos()).isEqualByComparingTo("130");
        assertThat(response.getMovimientos()).isNotEmpty();
    }

    @Test
    void generarPendientes_filtraPagadosYProveedor() {
        ReportFilterRequest filtro = new ReportFilterRequest();
        filtro.setProveedorId(10L);

        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(obrasClient.obtenerCostos(1L)).thenReturn(costosObra1);
        when(obrasClient.obtenerCostos(2L)).thenReturn(costosObra2);
        when(proveedoresClient.obtenerProveedores()).thenReturn(List.of(proveedor1, proveedor2));
        when(obrasClient.obtenerEstadosPago()).thenReturn(List.of(estadoPendiente, estadoPagado));

        PendientesResponse response = reportesService.generarPendientes(filtro);

        assertThat(response.getPendientes()).hasSize(2);
        assertThat(response.getPendientes())
                .extracting(PendientesResponse.Pendiente::getDescripcion)
                .contains("Cemento", "Arena");
    }

    @Test
    void generarEstadoObras_filtraPorEstadoYFecha() {
        EstadoObraFilterRequest filtro = new EstadoObraFilterRequest();
        filtro.setEstados(List.of("EN_PROGRESO"));
        filtro.setFechaInicio(LocalDate.of(2024, 1, 1));
        filtro.setFechaFin(LocalDate.of(2024, 1, 31));

        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(clientesClient.obtenerClientes()).thenReturn(List.of(cliente1, cliente2));

        EstadoObrasResponse response = reportesService.generarEstadoObras(filtro);

        assertThat(response.getObras()).hasSize(1);
        assertThat(response.getObras().get(0).getObraNombre()).isEqualTo("Obra A");
    }

    @Test
    void generarAvanceTareas_conProveedor() {
        ReportFilterRequest filtro = new ReportFilterRequest();
        filtro.setProveedorId(10L);

        TareaExternalDto t1 = tarea(1L, 1L, "COMPLETADA");
        TareaExternalDto t2 = tarea(2L, 1L, "PENDIENTE");

        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1));
        when(obrasClient.obtenerTareasPorProveedor(10L)).thenReturn(List.of(t1, t2));

        AvanceTareasResponse response = reportesService.generarAvanceTareas(filtro);

        assertThat(response.getAvances()).hasSize(1);
        AvanceTareasResponse.AvanceObra avance = response.getAvances().get(0);
        assertThat(avance.getTotalTareas()).isEqualTo(2);
        assertThat(avance.getTareasCompletadas()).isEqualTo(1);
        assertThat(avance.getPorcentaje()).isEqualByComparingTo("50.00");
    }

    @Test
    void generarAvanceTareas_sinProveedor_usaProgresoOFallback() {
        ReportFilterRequest filtro = new ReportFilterRequest();

        ProgresoExternalDto progreso = new ProgresoExternalDto();
        progreso.setIdObra(1L);
        progreso.setTotalTareas(4);
        progreso.setTareasCompletadas(2);
        progreso.setPorcentaje(new BigDecimal("50"));

        TareaExternalDto t3 = tarea(3L, 2L, "COMPLETADA");

        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(obrasClient.obtenerProgreso(1L)).thenReturn(Optional.of(progreso));
        when(obrasClient.obtenerProgreso(2L)).thenReturn(Optional.empty());
        when(obrasClient.obtenerTareasDeObra(2L)).thenReturn(List.of(t3));

        AvanceTareasResponse response = reportesService.generarAvanceTareas(filtro);

        assertThat(response.getAvances()).hasSize(2);
        assertThat(response.getAvances())
                .extracting(AvanceTareasResponse.AvanceObra::getPorcentaje)
                .contains(new BigDecimal("50"), new BigDecimal("100.00"));
    }

    @Test
    void generarCostosPorCategoria_calculaTotales() {
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(obrasClient.obtenerCostos(1L)).thenReturn(costosObra1);
        when(obrasClient.obtenerCostos(2L)).thenReturn(costosObra2);
        when(proveedoresClient.obtenerProveedores()).thenReturn(List.of(proveedor1, proveedor2));

        CostosPorCategoriaResponse response = reportesService.generarCostosPorCategoria(new ReportFilterRequest());

        assertThat(response.getTotal()).isEqualByComparingTo("310");
        assertThat(response.getCategorias()).hasSize(2);
        assertThat(response.getCategorias())
                .extracting(CostosPorCategoriaResponse.CategoriaCosto::getCategoria)
                .anySatisfy(categoria -> assertThat(categoria).startsWith("Sin"))
                .anySatisfy(categoria -> assertThat(categoria).isEqualTo("Materiales"));
    }

    @Test
    void generarResumenGeneral_resumenBasico() {
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(clientesClient.obtenerClientes()).thenReturn(List.of(cliente1, cliente2));
        when(proveedoresClient.obtenerProveedores()).thenReturn(List.of(proveedor1, proveedor2));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(transacciones);

        ResumenGeneralResponse response = reportesService.generarResumenGeneral();

        assertThat(response.getTotalObras()).isEqualTo(2);
        assertThat(response.getTotalClientes()).isEqualTo(2);
        assertThat(response.getTotalProveedores()).isEqualTo(2);
        assertThat(response.getTotalIngresos()).isEqualByComparingTo("500");
        assertThat(response.getTotalEgresos()).isEqualByComparingTo("130");
    }

    @Test
    void generarCuentaCorrientePorObra_calculaSaldosYMovimientos() {
        when(obrasClient.obtenerObra(1L)).thenReturn(Optional.of(obra1));
        when(clientesClient.obtenerClientes()).thenReturn(List.of(cliente1));
        when(obrasClient.obtenerCostos(1L)).thenReturn(costosObra1);
        when(transaccionesClient.obtenerTransacciones()).thenReturn(transacciones);
        when(movimientoReporteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CuentaCorrienteObraResponse response = reportesService.generarCuentaCorrientePorObra(1L);

        assertThat(response.getCostoTotal()).isEqualByComparingTo("250");
        assertThat(response.getPagosRecibidos()).isEqualByComparingTo("1199");
        assertThat(response.getSaldoPendiente()).isEqualByComparingTo("0");
        assertThat(response.getMovimientos()).isNotEmpty();
        verify(movimientoReporteRepository, atLeastOnce()).save(any());
    }

    @Test
    void generarCuentaCorrientePorProveedor_calculaSaldos() {
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(obrasClient.obtenerCostos(1L)).thenReturn(costosObra1);
        when(obrasClient.obtenerCostos(2L)).thenReturn(costosObra2);
        when(transaccionesClient.obtenerTransacciones()).thenReturn(transacciones);
        when(proveedoresClient.obtenerProveedores()).thenReturn(List.of(proveedor1, proveedor2));
        when(movimientoReporteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CuentaCorrienteProveedorResponse response = reportesService.generarCuentaCorrientePorProveedor(10L);

        assertThat(response.getCostos()).isEqualByComparingTo("160");
        assertThat(response.getPagos()).isEqualByComparingTo("50");
        assertThat(response.getSaldo()).isEqualByComparingTo("110");
        assertThat(response.getMovimientos()).isNotEmpty();
    }

    @Test
    void generarComisionesPorObra_conRegistros() {
        Comision comision = new Comision();
        comision.setIdObra(1L);
        comision.setMonto(new BigDecimal("50"));
        comision.setPagado(true);

        when(obrasClient.obtenerObra(1L)).thenReturn(Optional.of(obra1));
        when(comisionRepository.findByIdObra(1L)).thenReturn(List.of(comision));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(List.of(
                transaccion(10L, 1L, "PAGO", 50d, true, LocalDate.of(2024, 1, 18), "COMISION", 0L)
        ));
        when(movimientoReporteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ComisionesResponse response = reportesService.generarComisionesPorObra(1L);

        assertThat(response.getTotalComision()).isEqualByComparingTo("50");
        assertThat(response.getTotalPagos()).isEqualByComparingTo("50");
        assertThat(response.getSaldo()).isEqualByComparingTo("0");
    }

    @Test
    void generarComisionesPorObra_fallbackDesdeObra() {
        when(obrasClient.obtenerObra(1L)).thenReturn(Optional.of(obra1));
        when(comisionRepository.findByIdObra(1L)).thenReturn(Collections.emptyList());
        when(transaccionesClient.obtenerTransacciones()).thenReturn(Collections.emptyList());

        ComisionesResponse response = reportesService.generarComisionesPorObra(1L);

        assertThat(response.getTotalComision()).isEqualByComparingTo("100.00");
        assertThat(response.getSaldo()).isEqualByComparingTo("100.00");
    }

    @Test
    void generarComisionesGeneral_incluyeFallback() {
        Comision comision = new Comision();
        comision.setIdObra(1L);
        comision.setMonto(new BigDecimal("50"));
        comision.setPagado(false);

        when(comisionRepository.findAll()).thenReturn(List.of(comision));
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(List.of(
                transaccion(11L, 1L, "PAGO", 25d, true, LocalDate.of(2024, 1, 19), "COMISION", 0L)
        ));
        when(movimientoReporteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ComisionesResponse response = reportesService.generarComisionesGeneral();

        assertThat(response.getTotalComision()).isEqualByComparingTo("75.00");
        assertThat(response.getSaldo()).isEqualByComparingTo("50.00");
    }

    @Test
    void generarComisionesFront_conFiltro() {
        Comision comision = new Comision();
        comision.setIdObra(1L);
        comision.setMonto(new BigDecimal("50"));
        comision.setFecha(LocalDate.of(2024, 1, 15));

        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(comisionRepository.findAll()).thenReturn(List.of(comision));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(Collections.emptyList());

        ComisionesFrontResponse response = reportesService.generarComisiones(new ReportFilterRequest());

        assertThat(response.getTotal()).isEqualByComparingTo("75.00");
        assertThat(response.getComisiones()).hasSize(2);
    }

    @Test
    void generarRankingClientes_ordenaPorIngresos() {
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(clientesClient.obtenerClientes()).thenReturn(List.of(cliente1, cliente2));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(transacciones);

        RankingClientesResponse response = reportesService.generarRankingClientes(new ReportFilterRequest());

        assertThat(response.getClientes()).hasSize(2);
        assertThat(response.getClientes().get(0).getClienteId()).isEqualTo(101L);
    }

    @Test
    void generarRankingProveedores_calculaTotales() {
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(obrasClient.obtenerCostos(1L)).thenReturn(costosObra1);
        when(obrasClient.obtenerCostos(2L)).thenReturn(costosObra2);
        when(proveedoresClient.obtenerProveedores()).thenReturn(List.of(proveedor1, proveedor2));

        RankingProveedoresResponse response = reportesService.generarRankingProveedores(new ReportFilterRequest());

        assertThat(response.getProveedores()).hasSize(2);
        assertThat(response.getProveedores().get(0).getProveedorId()).isEqualTo(10L);
    }

    @Test
    void generarNotas() {
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra1, obra2));
        when(clientesClient.obtenerClientes()).thenReturn(List.of(cliente1, cliente2));
        when(obrasClient.obtenerObra(1L)).thenReturn(Optional.of(obra1));

        List<NotasObraResponse> notas = reportesService.generarNotasGenerales();
        NotasObraResponse notaObra = reportesService.generarNotasPorObra(1L);

        assertThat(notas).hasSize(2);
        assertThat(notaObra.getObraNombre()).isEqualTo("Obra A");
    }

    private static TransaccionExternalDto transaccion(Long id, Long obraId, String tipo, Double monto,
                                                      boolean activo, LocalDate fecha, String tipoAsociado,
                                                      Long idAsociado) {
        TransaccionExternalDto tx = new TransaccionExternalDto();
        tx.setId(id);
        tx.setIdObra(obraId);
        tx.setTipoTransaccion(tipo);
        tx.setMonto(monto);
        tx.setActivo(activo);
        tx.setFecha(fecha);
        tx.setTipoAsociado(tipoAsociado);
        tx.setIdAsociado(idAsociado);
        return tx;
    }

    private static TareaExternalDto tarea(Long id, Long obraId, String estado) {
        TareaExternalDto tarea = new TareaExternalDto();
        tarea.setId(id);
        tarea.setIdObra(obraId);
        tarea.setEstadoTarea(estado);
        return tarea;
    }
}
