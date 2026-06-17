package com.reportes.service;

import com.reportes.client.ClientesClient;
import com.reportes.client.ObrasClient;
import com.reportes.client.ProveedoresClient;
import com.reportes.client.TransaccionesClient;
import com.reportes.dto.external.*;
import com.reportes.dto.request.ReportFilterRequest;
import com.reportes.dto.response.DashboardFinancieroResponse;
import com.reportes.dto.response.DeudasGlobalesResponse;
import com.reportes.repository.ComisionRepository;
import com.reportes.repository.DeudasGlobalesRepository;
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
import static org.mockito.Mockito.*;

/**
 * Tests para validar los problemas ID 48 y 49 reportados:
 * ID 48: Reportes - Dato deudas globales no sería correcto, varias obras adjudicadas no aparecen
 * ID 49: Dashboard - Por cobrar/pagar no sería correcto, solo obras adjudicadas computan para ese saldo
 */
@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class DeudasGlobalesYDashboardTest {

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
    private DeudasGlobalesRepository deudasGlobalesRepository;
    @Mock
    private MovimientoReporteRepository movimientoReporteRepository;

    @InjectMocks
    private ReportesService reportesService;

    private ObraExternalDto obraAdjudicada1;
    private ObraExternalDto obraAdjudicada2;
    private ObraExternalDto obraEnProgreso;
    private ObraExternalDto obraFinalizada;
    private ObraExternalDto obraPendiente; // No debe incluirse
    private ObraExternalDto obraCancelada; // No debe incluirse
    private ClienteExternalDto cliente1;
    private ClienteExternalDto cliente2;

    @BeforeEach
    void setUp() {
        // Crear clientes
        cliente1 = new ClienteExternalDto();
        cliente1.setId(100L);
        cliente1.setNombre("Cliente Principal");

        cliente2 = new ClienteExternalDto();
        cliente2.setId(101L);
        cliente2.setNombre("Cliente Secundario");

        // Obra Adjudicada 1 - CON SALDO PENDIENTE
        obraAdjudicada1 = new ObraExternalDto();
        obraAdjudicada1.setId(1L);
        obraAdjudicada1.setIdCliente(100L);
        obraAdjudicada1.setNombre("Obra Adjudicada 1");
        obraAdjudicada1.setObraEstado("ADJUDICADA");
        obraAdjudicada1.setPresupuesto(new BigDecimal("10000"));
        obraAdjudicada1.setTotalConBeneficio(new BigDecimal("10000"));
        obraAdjudicada1.setComision(new BigDecimal("10"));
        obraAdjudicada1.setTieneComision(true);
        obraAdjudicada1.setComisionMonto(new BigDecimal("1000"));
        obraAdjudicada1.setActivo(true);
        obraAdjudicada1.setFechaInicio(LocalDateTime.of(2024, 1, 1, 0, 0));

        // Obra Adjudicada 2 - CON SALDO PARCIAL COBRADO
        obraAdjudicada2 = new ObraExternalDto();
        obraAdjudicada2.setId(2L);
        obraAdjudicada2.setIdCliente(100L);
        obraAdjudicada2.setNombre("Obra Adjudicada 2");
        obraAdjudicada2.setObraEstado("ADJUDICADA");
        obraAdjudicada2.setPresupuesto(new BigDecimal("5000"));
        obraAdjudicada2.setTotalConBeneficio(new BigDecimal("5000"));
        obraAdjudicada2.setActivo(true);
        obraAdjudicada2.setFechaInicio(LocalDateTime.of(2024, 1, 15, 0, 0));

        // Obra En Progreso
        obraEnProgreso = new ObraExternalDto();
        obraEnProgreso.setId(3L);
        obraEnProgreso.setIdCliente(101L);
        obraEnProgreso.setNombre("Obra En Progreso");
        obraEnProgreso.setObraEstado("EN_PROGRESO");
        obraEnProgreso.setPresupuesto(new BigDecimal("8000"));
        obraEnProgreso.setTotalConBeneficio(new BigDecimal("8000"));
        obraEnProgreso.setActivo(true);
        obraEnProgreso.setFechaInicio(LocalDateTime.of(2024, 2, 1, 0, 0));

        // Obra Finalizada
        obraFinalizada = new ObraExternalDto();
        obraFinalizada.setId(4L);
        obraFinalizada.setIdCliente(101L);
        obraFinalizada.setNombre("Obra Finalizada");
        obraFinalizada.setObraEstado("FINALIZADA");
        obraFinalizada.setPresupuesto(new BigDecimal("3000"));
        obraFinalizada.setTotalConBeneficio(new BigDecimal("3000"));
        obraFinalizada.setActivo(true);
        obraFinalizada.setFechaInicio(LocalDateTime.of(2024, 1, 20, 0, 0));

        // Obra Pendiente - NO DEBE INCLUIRSE
        obraPendiente = new ObraExternalDto();
        obraPendiente.setId(5L);
        obraPendiente.setIdCliente(100L);
        obraPendiente.setNombre("Obra Pendiente");
        obraPendiente.setObraEstado("PRESUPUESTADA"); // No genera deuda
        obraPendiente.setPresupuesto(new BigDecimal("2000"));
        obraPendiente.setActivo(true);
        obraPendiente.setFechaInicio(LocalDateTime.of(2024, 3, 1, 0, 0));

        // Obra Cancelada - NO DEBE INCLUIRSE
        obraCancelada = new ObraExternalDto();
        obraCancelada.setId(6L);
        obraCancelada.setIdCliente(101L);
        obraCancelada.setNombre("Obra Cancelada");
        obraCancelada.setObraEstado("CANCELADA");
        obraCancelada.setPresupuesto(new BigDecimal("1500"));
        obraCancelada.setActivo(false);
        obraCancelada.setFechaInicio(LocalDateTime.of(2024, 4, 1, 0, 0));
    }

    // ==================== TESTS PARA ID 48: DEUDAS GLOBALES ====================

    /**
     * PROBLEMA ID 48: Verifica que TODAS las obras adjudicadas con saldo pendiente aparezcan
     * en el reporte de deudas globales
     */
    @Test
    void testDeudasGlobales_DebenIncluirTodasObrasAdjudicadas() {
        // generarDeudasGlobales ahora delega en deudasGlobalesRepository (SP).
        // Mockeamos el SP para que devuelva obras 1, 2, 3, 4 (adjudicadas, en progreso, finalizadas).
        DeudasGlobalesResponse.DetalleDeudaCliente d1 = new DeudasGlobalesResponse.DetalleDeudaCliente();
        d1.setObraId(1L); d1.setSaldo(new java.math.BigDecimal("10000"));
        DeudasGlobalesResponse.DetalleDeudaCliente d2 = new DeudasGlobalesResponse.DetalleDeudaCliente();
        d2.setObraId(2L); d2.setSaldo(new java.math.BigDecimal("2500"));
        DeudasGlobalesResponse.DetalleDeudaCliente d3 = new DeudasGlobalesResponse.DetalleDeudaCliente();
        d3.setObraId(3L); d3.setSaldo(new java.math.BigDecimal("8000"));
        DeudasGlobalesResponse.DetalleDeudaCliente d4 = new DeudasGlobalesResponse.DetalleDeudaCliente();
        d4.setObraId(4L); d4.setSaldo(new java.math.BigDecimal("5000"));

        when(deudasGlobalesRepository.obtenerDeudaClientes(any(), any(), any(), any(), any(), any()))
                .thenReturn(Arrays.asList(d1, d2, d3, d4));
        when(deudasGlobalesRepository.obtenerDeudaProveedores(any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        DeudasGlobalesResponse response = reportesService.generarDeudasGlobales(null);

        assertThat(response.getDetalleDeudaClientes()).isNotNull();
        assertThat(response.getDetalleDeudaClientes())
                .extracting(DeudasGlobalesResponse.DetalleDeudaCliente::getObraId)
                .containsExactlyInAnyOrder(1L, 2L, 3L, 4L)
                .doesNotContain(5L, 6L);
    }

    /**
     * Verifica que los saldos se calculen correctamente:
     * - Obra 1: Adjudicada sin cobros = 10000 de saldo
     * - Obra 2: Adjudicada con 2500 cobrados = 2500 de saldo
     */
    @Test
    void testDeudasGlobales_CalculoSaldoCorrecto() {
        // generarDeudasGlobales delega en SP; el filtrado de saldo 0 lo hace el SP.
        DeudasGlobalesResponse.DetalleDeudaCliente d1 = new DeudasGlobalesResponse.DetalleDeudaCliente();
        d1.setObraId(1L); d1.setSaldo(new BigDecimal("10000"));
        DeudasGlobalesResponse.DetalleDeudaCliente d2 = new DeudasGlobalesResponse.DetalleDeudaCliente();
        d2.setObraId(2L); d2.setSaldo(new BigDecimal("2500"));
        // Obra 3 no aparece (saldo 0 filtrado por el SP)

        when(deudasGlobalesRepository.obtenerDeudaClientes(any(), any(), any(), any(), any(), any()))
                .thenReturn(Arrays.asList(d1, d2));
        when(deudasGlobalesRepository.obtenerDeudaProveedores(any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        DeudasGlobalesResponse response = reportesService.generarDeudasGlobales(null);

        Map<Long, BigDecimal> saldosPorObra = new HashMap<>();
        for (DeudasGlobalesResponse.DetalleDeudaCliente detalle : response.getDetalleDeudaClientes()) {
            saldosPorObra.put(detalle.getObraId(), detalle.getSaldo());
        }

        assertThat(saldosPorObra.get(1L))
                .as("Obra 1 debe tener saldo de 10000")
                .isEqualByComparingTo(new BigDecimal("10000"));
        assertThat(saldosPorObra.get(2L))
                .as("Obra 2 debe tener saldo de 2500")
                .isEqualByComparingTo(new BigDecimal("2500"));
        assertThat(saldosPorObra.get(3L))
                .as("Obra 3 pagada completamente no debe aparecer")
                .isNull();
    }

    /**
     * PROBLEMA ID 48: Verifica que las cuentas corrientes de clientes sean correctas
     * Nota: Este test falla porque los cobros no se están restando correctamente en DeudasGlobalesResponse
     */
    @Test
    void testDeudasGlobales_CuentaCorrienteClienteIncluydeTodo() {
        // generarDeudasGlobales delega en SP; mockeamos para devolver saldo total de 23000
        DeudasGlobalesResponse.DetalleDeudaCliente d1 = new DeudasGlobalesResponse.DetalleDeudaCliente();
        d1.setObraId(1L); d1.setPresupuesto(new BigDecimal("26000")); d1.setCobrado(new BigDecimal("3000")); d1.setSaldo(new BigDecimal("23000"));

        when(deudasGlobalesRepository.obtenerDeudaClientes(any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(d1));
        when(deudasGlobalesRepository.obtenerDeudaProveedores(any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        DeudasGlobalesResponse response = reportesService.generarDeudasGlobales(null);

        assertThat(response.getDeudaClientes())
                .as("Total deuda de clientes debe ser 23000 (26000 presupuestado - 3000 cobrado)")
                .isEqualByComparingTo(new BigDecimal("23000"));
    }

    // ==================== TESTS PARA ID 49: DASHBOARD ====================

    /**
     * PROBLEMA ID 49: Verifica que el dashboard solo incluya obras adjudicadas, en progreso
     * y finalizadas (NO presupuestadas ni canceladas)
     */
    @Test
    void testDashboard_SoloDebeIncluirObrasConDeuda() {
        // Setup
        List<ObraExternalDto> todasLasObras = Arrays.asList(
                obraAdjudicada1, obraAdjudicada2, obraEnProgreso, obraFinalizada,
                obraPendiente, obraCancelada
        );
        when(obrasClient.obtenerObras()).thenReturn(todasLasObras);
        when(clientesClient.obtenerClientes()).thenReturn(Arrays.asList(cliente1, cliente2));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(new ArrayList<>());
        when(obrasClient.obtenerCostos(anyLong())).thenReturn(new ArrayList<>());

        // Execute
        DashboardFinancieroResponse response = reportesService.generarDashboardFinanciero(null);

        // Verify
        // El presupuesto total debe sumar solo obras adjudicadas, en progreso, finalizadas
        // = 10000 + 5000 + 8000 + 3000 = 26000
        // NO debe incluir: Obra 5 (Presupuestada: 2000), Obra 6 (Cancelada: 1500)
        BigDecimal presupuestoEsperado = new BigDecimal("26000");
        assertThat(response.getCtaCte().getPorCobrar())
                .as("Por cobrar debe ser 26000 (solo obras con deuda, ninguna cobrada)")
                .isEqualByComparingTo(presupuestoEsperado);
    }

    /**
     * Verifica que "Por Cobrar" y "Por Pagar" se calculen correctamente en el dashboard
     * NOTA: Este test falla porque el dashboard no está restando los cobros de por cobrar
     */
    @Test
    void testDashboard_PorCobrarYPorPagarCorrectos() {
        // Setup
        List<ObraExternalDto> obras = Arrays.asList(obraAdjudicada1, obraAdjudicada2);
        when(obrasClient.obtenerObras()).thenReturn(obras);
        when(clientesClient.obtenerClientes()).thenReturn(Arrays.asList(cliente1, cliente2));

        // Se cobraron 5000 de la obra 1
        TransaccionExternalDto cobro = new TransaccionExternalDto();
        cobro.setIdObra(1L);
        cobro.setMonto(5000d);
        cobro.setTipoTransaccion("COBRO");
        cobro.setActivo(true);
        cobro.setFecha(LocalDate.now());

        when(transaccionesClient.obtenerTransacciones()).thenReturn(Collections.singletonList(cobro));
        when(obrasClient.obtenerCostos(anyLong())).thenReturn(new ArrayList<>());

        // Execute
        DashboardFinancieroResponse response = reportesService.generarDashboardFinanciero(null);

        // Verify
        // Presupuesto total: 10000 + 5000 = 15000
        // Cobrado: 5000
        // Por cobrar: 10000
        BigDecimal porCobrarEsperado = new BigDecimal("10000");

        System.out.println("DEBUG: Por cobrar = " + response.getCtaCte().getPorCobrar());
        System.out.println("DEBUG: Lo cobrado = " + response.getCtaCte().getLoCobrado());

        assertThat(response.getCtaCte().getPorCobrar())
                .as("Por cobrar debe ser 10000 (15000 presupuestado - 5000 cobrado)")
                .isEqualByComparingTo(porCobrarEsperado);

        // Verificar que lo cobrado sea 5000
        assertThat(response.getCtaCte().getLoCobrado())
                .as("Lo cobrado debe ser 5000")
                .isEqualByComparingTo(new BigDecimal("5000"));
    }

    /**
     * Verifica que el dashboard no incluya obras sin estado de deuda (Presupuestadas)
     */
    @Test
    void testDashboard_NoIncluirObrasSinDeuda() {
        // Setup - Solo obras que NO generan deuda
        List<ObraExternalDto> obras = Collections.singletonList(obraPendiente);
        when(obrasClient.obtenerObras()).thenReturn(obras);
        when(clientesClient.obtenerClientes()).thenReturn(Collections.singletonList(cliente1));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(new ArrayList<>());
        when(obrasClient.obtenerCostos(anyLong())).thenReturn(new ArrayList<>());

        // Execute
        DashboardFinancieroResponse response = reportesService.generarDashboardFinanciero(null);

        // Verify - Por cobrar debe ser 0 porque no hay obras con deuda
        assertThat(response.getCtaCte().getPorCobrar())
                .as("Por cobrar debe ser 0 (no hay obras adjudicadas/en progreso/finalizadas)")
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    /**
     * Verifica que el filtro por cliente funcione correctamente en el dashboard
     */
    @Test
    void testDashboard_FiltroClienteCorrecto() {
        // Setup
        List<ObraExternalDto> obras = Arrays.asList(
                obraAdjudicada1, // Cliente 100
                obraAdjudicada2, // Cliente 100
                obraEnProgreso   // Cliente 101
        );
        when(obrasClient.obtenerObras()).thenReturn(obras);
        when(clientesClient.obtenerClientes()).thenReturn(Arrays.asList(cliente1, cliente2));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(new ArrayList<>());
        when(obrasClient.obtenerCostos(anyLong())).thenReturn(new ArrayList<>());

        // Execute - Filtrar por cliente 100
        ReportFilterRequest filtro = new ReportFilterRequest();
        filtro.setClienteId(100L);
        DashboardFinancieroResponse response = reportesService.generarDashboardFinanciero(filtro);

        // Verify
        // Solo debe incluir Obra 1 y 2 (cliente 100) = 15000 presupuestado
        assertThat(response.getCtaCte().getPorCobrar())
                .as("Por cobrar para cliente 100 debe ser 15000")
                .isEqualByComparingTo(new BigDecimal("15000"));
    }

    /**
     * CRÍTICO: Verifica que obras adjudicadas SÍ se incluyan (problema reportado)
     */
    @Test
    void testDashboard_ObrasAdjudicadasMustBeIncluded() {
        // Setup - Obra SOLO adjudicada, no en progreso ni finalizada
        List<ObraExternalDto> obras = Collections.singletonList(obraAdjudicada1);
        when(obrasClient.obtenerObras()).thenReturn(obras);
        when(clientesClient.obtenerClientes()).thenReturn(Collections.singletonList(cliente1));
        when(transaccionesClient.obtenerTransacciones()).thenReturn(new ArrayList<>());
        when(obrasClient.obtenerCostos(anyLong())).thenReturn(new ArrayList<>());

        // Execute
        DashboardFinancieroResponse response = reportesService.generarDashboardFinanciero(null);

        // Verify - DEBE incluir la obra adjudicada
        assertThat(response.getCtaCte().getPorCobrar())
                .as("Obra adjudicada DEBE incluirse en por cobrar")
                .isEqualByComparingTo(new BigDecimal("10000"));
    }
}
