package com.reportes.service;

import com.reportes.client.ClientesClient;
import com.reportes.client.ObrasClient;
import com.reportes.client.ProveedoresClient;
import com.reportes.client.TransaccionesClient;
import com.reportes.dto.external.*;
import com.reportes.dto.response.CuentaCorrienteObraResponse;
import com.reportes.dto.response.CuentaCorrienteProveedorResponse;
import com.reportes.dto.response.IngresosEgresosResponse;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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

    private ObraExternalDto obra;
    private ClienteExternalDto cliente;

    @BeforeEach
    void setUp() {
        obra = new ObraExternalDto();
        obra.setId(1L);
        obra.setNombre("Obra Centro");
        obra.setIdCliente(5L);

        cliente = new ClienteExternalDto();
        cliente.setId(5L);
        cliente.setNombre("Cliente QA");
    }

    @Test
    void generarIngresosEgresosCalculaSaldos() {
        when(clientesClient.obtenerClientes()).thenReturn(List.of(cliente));
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra));

        TransaccionExternalDto cobro = new TransaccionExternalDto();
        cobro.setId(10L);
        cobro.setIdObra(1L);
        cobro.setTipoTransaccion("COBRO");
        cobro.setMonto(2000d);
        TransaccionExternalDto pago = new TransaccionExternalDto();
        pago.setId(11L);
        pago.setIdObra(1L);
        pago.setTipoTransaccion("PAGO");
        pago.setMonto(800d);
        when(transaccionesClient.obtenerTransacciones()).thenReturn(List.of(cobro, pago));

        IngresosEgresosResponse response = reportesService.generarIngresosEgresos(null);

        assertThat(response.getTotalIngresos()).isEqualByComparingTo(BigDecimal.valueOf(2000));
        assertThat(response.getTotalEgresos()).isEqualByComparingTo(BigDecimal.valueOf(800));
        assertThat(response.getDetallePorObra()).hasSize(1);
    }

    @Test
    void cuentaCorrienteObraCalculaSaldoSinNegativos() {
        ObraCostoExternalDto costo = new ObraCostoExternalDto();
        costo.setActivo(true);
        costo.setTotal(BigDecimal.valueOf(1000));
        costo.setDescripcion("Materiales");
        when(obrasClient.obtenerObra(anyLong())).thenReturn(Optional.of(obra));
        when(obrasClient.obtenerCostos(anyLong())).thenReturn(List.of(costo));
        when(clientesClient.obtenerClientes()).thenReturn(List.of(cliente));

        TransaccionExternalDto cobro = new TransaccionExternalDto();
        cobro.setIdObra(1L);
        cobro.setTipoTransaccion("COBRO");
        cobro.setMonto(2000d);
        when(transaccionesClient.obtenerTransacciones()).thenReturn(List.of(cobro));

        CuentaCorrienteObraResponse response = reportesService.generarCuentaCorrientePorObra(1L);

        assertThat(response.getCostoTotal()).isEqualByComparingTo(BigDecimal.valueOf(1000));
        assertThat(response.getSaldoPendiente()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(movimientoReporteRepository, atLeastOnce()).save(any());
    }

    @Test
    void cuentaCorrienteProveedorBalanceaPagos() {
        ProveedorExternalDto proveedor = new ProveedorExternalDto();
        proveedor.setId(9L);
        proveedor.setNombre("Proveedor Test");
        when(proveedoresClient.obtenerProveedores()).thenReturn(List.of(proveedor));
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra));

        ObraCostoExternalDto costo = new ObraCostoExternalDto();
        costo.setIdProveedor(9L);
        costo.setActivo(true);
        costo.setTotal(BigDecimal.valueOf(500));
        when(obrasClient.obtenerCostos(1L)).thenReturn(List.of(costo));

        TransaccionExternalDto pago = new TransaccionExternalDto();
        pago.setIdObra(1L);
        pago.setIdAsociado(9L);
        pago.setTipoTransaccion("PAGO");
        pago.setMonto(800d);
        when(transaccionesClient.obtenerTransacciones()).thenReturn(List.of(pago));

        CuentaCorrienteProveedorResponse response = reportesService.generarCuentaCorrientePorProveedor(9L);

        assertThat(response.getCostos()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(response.getSaldo()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(movimientoReporteRepository, atLeastOnce()).save(any());
    }

    @Test
    void comisionesGeneralSumaMontos() {
        Comision comision = new Comision();
        comision.setIdObra(1L);
        comision.setMonto(BigDecimal.valueOf(300));
        comision.setPagado(Boolean.TRUE);
        when(comisionRepository.findAll()).thenReturn(List.of(comision));
        when(obrasClient.obtenerObras()).thenReturn(List.of(obra));

        var response = reportesService.generarComisionesGeneral();

        assertThat(response.getTotalComision()).isEqualByComparingTo(BigDecimal.valueOf(300));
        assertThat(response.getSaldo()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
