package com.transacciones.service;

import com.transacciones.dto.FacturaDto;
import com.transacciones.dto.ObraResumenDto;
import com.transacciones.entity.Factura;
import com.transacciones.repository.FacturaRepository;
import com.transacciones.repository.TransaccionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FacturaServiceTest {

    @Mock
    private FacturaRepository facturaRepository;

    @Mock
    private TransaccionRepository transaccionRepository;

    @Mock
    private ObraCostoClient obraCostoClient;

    @Mock
    private DocumentoClient documentoClient;

    @InjectMocks
    private FacturaService service;

    @Captor
    private ArgumentCaptor<Factura> facturaCaptor;

    @TempDir
    Path tempDir;

    private FacturaDto baseDto() {
        return FacturaDto.builder()
                .id_cliente(1L)
                .id_obra(2L)
                .monto(100d)
                .monto_restante(0d)
                .fecha(LocalDate.now())
                .estado("EMITIDA")
                .impacta_cta_cte(false)
                .build();
    }

    @Test
    void listar_ok() {
        Factura f = Factura.builder().id(1L).idCliente(1L).monto(10d).montoRestante(0d).build();
        when(facturaRepository.findAll()).thenReturn(List.of(f));

        List<FacturaDto> result = service.listar(null);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void obtener_no_encontrado_lanza_excepcion() {
        when(facturaRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.obtener(99L));
    }

    @Test
    void crear_sin_impacto_no_crea_transaccion() {
        FacturaDto dto = baseDto();
        dto.setId_obra(null);
        when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> {
            Factura f = invocation.getArgument(0);
            f.setId(5L);
            return f;
        });

        FacturaDto result = service.crear(dto, null);

        assertEquals(5L, result.getId());
        verify(transaccionRepository, never()).save(any());
    }

    @Test
    void crear_con_impacto_no_crea_transaccion_funcionalidad_deshabilitada() {
        // "Impacta cta. cte." está deshabilitada a pedido (ver FacturaService.crear):
        // aunque el DTO pida impactar, no debe tocar transaccionRepository para nada.
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(200d);
        when(obraCostoClient.obtenerObra(2L)).thenReturn(obra);
        when(facturaRepository.findByIdObra(2L)).thenReturn(List.of());
        when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FacturaDto dto = baseDto();
        dto.setImpacta_cta_cte(true);

        FacturaDto result = service.crear(dto, null);

        verify(transaccionRepository, never()).save(any());
        assertNull(result.getId_transaccion());
    }

    @Test
    void crear_con_archivo_lo_sube_a_documentos_service() {
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(200d);
        when(obraCostoClient.obtenerObra(2L)).thenReturn(obra);
        when(facturaRepository.findByIdObra(2L)).thenReturn(List.of());
        when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FacturaDto dto = baseDto();
        MockMultipartFile file = new MockMultipartFile("file", "mi factura.pdf", "application/pdf", "data".getBytes());
        when(documentoClient.subirDocumentoFactura(2L, 1L, file)).thenReturn(77L);

        service.crear(dto, file);

        verify(facturaRepository).save(facturaCaptor.capture());
        Factura saved = facturaCaptor.getValue();
        assertEquals(77L, saved.getIdDocumento());
        assertNull(saved.getPathArchivo());
        assertEquals("mi factura.pdf", saved.getNombreArchivo());
    }

    @Test
    void crear_monto_supera_presupuesto_lanza_excepcion() {
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(50d);
        when(obraCostoClient.obtenerObra(2L)).thenReturn(obra);
        when(facturaRepository.findByIdObra(2L)).thenReturn(List.of());

        FacturaDto dto = baseDto();
        dto.setMonto(120d);

        assertThrows(RuntimeException.class, () -> service.crear(dto, null));
    }

    @Test
    void crear_estado_invalido_lanza_excepcion() {
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(200d);
        when(obraCostoClient.obtenerObra(2L)).thenReturn(obra);
        when(facturaRepository.findByIdObra(2L)).thenReturn(List.of());

        FacturaDto dto = baseDto();
        dto.setEstado("OTRO");

        assertThrows(RuntimeException.class, () -> service.crear(dto, null));
    }

    @Test
    void actualizar_con_archivo_reemplaza_y_elimina_anterior() throws Exception {
        ReflectionTestUtils.setField(service, "uploadDirBase", tempDir.toString());
        Path oldFile = tempDir.resolve("facturas/1/old.txt");
        Files.createDirectories(oldFile.getParent());
        Files.writeString(oldFile, "old");

        Factura existente = Factura.builder()
                .id(11L)
                .idCliente(1L)
                .idObra(2L)
                .monto(100d)
                .montoRestante(0d)
                .fecha(LocalDate.now())
                .pathArchivo("facturas/1/old.txt")
                .nombreArchivo("old.txt")
                .build();
        when(facturaRepository.findById(11L)).thenReturn(Optional.of(existente));
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(500d);
        when(obraCostoClient.obtenerObra(2L)).thenReturn(obra);
        when(facturaRepository.findByIdObra(2L)).thenReturn(List.of(existente));
        when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FacturaDto dto = baseDto();
        MockMultipartFile file = new MockMultipartFile("file", "nuevo.txt", "text/plain", "data".getBytes());
        when(documentoClient.subirDocumentoFactura(2L, 1L, file)).thenReturn(88L);

        service.actualizar(11L, dto, file);

        assertFalse(Files.exists(oldFile));
        verify(facturaRepository).save(facturaCaptor.capture());
        assertEquals("nuevo.txt", facturaCaptor.getValue().getNombreArchivo());
        assertEquals(88L, facturaCaptor.getValue().getIdDocumento());
        assertNull(facturaCaptor.getValue().getPathArchivo());
    }

    @Test
    void actualizar_sin_impacto_no_toca_transaccion() {
        // Funcionalidad deshabilitada: actualizar ya no borra la transacción asociada
        // aunque impacta_cta_cte venga en false, para no alterar datos históricos.
        Factura existente = Factura.builder()
                .id(1L)
                .idCliente(1L)
                .idObra(2L)
                .monto(100d)
                .montoRestante(0d)
                .idTransaccion(10L)
                .fecha(LocalDate.now())
                .build();
        when(facturaRepository.findById(1L)).thenReturn(Optional.of(existente));
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(500d);
        when(obraCostoClient.obtenerObra(2L)).thenReturn(obra);
        when(facturaRepository.findByIdObra(2L)).thenReturn(List.of(existente));
        when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FacturaDto dto = baseDto();
        dto.setImpacta_cta_cte(false);

        service.actualizar(1L, dto, null);

        verify(transaccionRepository, never()).deleteById(any());
        verify(facturaRepository).save(facturaCaptor.capture());
        assertEquals(10L, facturaCaptor.getValue().getIdTransaccion());
    }

    @Test
    void actualizar_con_impacto_no_crea_ni_actualiza_transaccion_funcionalidad_deshabilitada() {
        Factura existente = Factura.builder()
                .id(12L)
                .idCliente(1L)
                .idObra(2L)
                .monto(100d)
                .montoRestante(0d)
                .idTransaccion(20L)
                .fecha(LocalDate.now())
                .build();
        when(facturaRepository.findById(12L)).thenReturn(Optional.of(existente));
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(200d);
        when(obraCostoClient.obtenerObra(2L)).thenReturn(obra);
        when(facturaRepository.findByIdObra(2L)).thenReturn(List.of(existente));
        when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FacturaDto dto = baseDto();
        dto.setImpacta_cta_cte(true);

        service.actualizar(12L, dto, null);

        verify(transaccionRepository, never()).save(any());
        verify(facturaRepository).save(facturaCaptor.capture());
        assertEquals(20L, facturaCaptor.getValue().getIdTransaccion());
    }

    @Test
    void eliminar_borra_archivo_y_transaccion() throws Exception {
        ReflectionTestUtils.setField(service, "uploadDirBase", tempDir.toString());
        Path file = tempDir.resolve("facturas/1/test.txt");
        Files.createDirectories(file.getParent());
        Files.writeString(file, "data");

        Factura existente = Factura.builder()
                .id(1L)
                .idCliente(1L)
                .monto(10d)
                .montoRestante(0d)
                .pathArchivo("facturas/1/test.txt")
                .idTransaccion(3L)
                .build();
        when(facturaRepository.findById(1L)).thenReturn(Optional.of(existente));

        service.eliminar(1L);

        assertFalse(Files.exists(file));
        verify(transaccionRepository).deleteById(3L);
        verify(facturaRepository).deleteById(1L);
    }

    @Test
    void descargar_sin_archivo_lanza_excepcion() {
        Factura existente = Factura.builder()
                .id(3L)
                .idCliente(1L)
                .monto(10d)
                .montoRestante(0d)
                .pathArchivo(null)
                .build();
        when(facturaRepository.findById(3L)).thenReturn(Optional.of(existente));

        assertThrows(RuntimeException.class, () -> service.descargarArchivo(3L));
    }

    @Test
    void descargar_archivo_no_existe_lanza_excepcion() {
        ReflectionTestUtils.setField(service, "uploadDirBase", tempDir.toString());
        Factura existente = Factura.builder()
                .id(4L)
                .idCliente(1L)
                .monto(10d)
                .montoRestante(0d)
                .pathArchivo("facturas/9/missing.pdf")
                .build();
        when(facturaRepository.findById(4L)).thenReturn(Optional.of(existente));

        assertThrows(RuntimeException.class, () -> service.descargarArchivo(4L));
    }

    @Test
    void descargar_archivo_ok() throws Exception {
        ReflectionTestUtils.setField(service, "uploadDirBase", tempDir.toString());
        Path file = tempDir.resolve("facturas/2/test.pdf");
        Files.createDirectories(file.getParent());
        Files.writeString(file, "data");

        Factura existente = Factura.builder()
                .id(2L)
                .idCliente(2L)
                .monto(10d)
                .montoRestante(0d)
                .pathArchivo("facturas/2/test.pdf")
                .nombreArchivo("test.pdf")
                .build();
        when(facturaRepository.findById(2L)).thenReturn(Optional.of(existente));

        Resource res = service.descargarArchivo(2L).getBody();

        assertNotNull(res);
        assertTrue(res.exists());
    }
}
