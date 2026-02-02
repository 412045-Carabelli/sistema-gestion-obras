package com.transacciones.service;

import com.transacciones.dto.ObraResumenDto;
import com.transacciones.dto.TransaccionDto;
import com.transacciones.entity.Transaccion;
import com.transacciones.enums.TipoTransaccionEnum;
import com.transacciones.repository.TransaccionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransaccionServiceTest {

    @Mock
    private TransaccionRepository transaccionRepository;

    @Mock
    private ObraCostoClient obraCostoClient;

    @InjectMocks
    private TransaccionService service;

    @Captor
    private ArgumentCaptor<Transaccion> transaccionCaptor;

    private Transaccion baseClienteCobro() {
        return Transaccion.builder()
                .idObra(1L)
                .idAsociado(2L)
                .tipoAsociado("CLIENTE")
                .tipo_transaccion(TipoTransaccionEnum.COBRO)
                .fecha(LocalDate.now())
                .monto(50d)
                .forma_pago("PARCIAL")
                .medio_pago("Efectivo")
                .facturaCobrada(false)
                .activo(true)
                .build();
    }

    @Test
    void crear_sin_tipo_lanza_excepcion() {
        Transaccion t = baseClienteCobro();
        t.setTipo_transaccion(null);
        assertThrows(IllegalArgumentException.class, () -> service.crear(t));
        verify(transaccionRepository, never()).save(any());
    }

    @Test
    void crear_cliente_con_tipo_invalido_lanza_excepcion() {
        Transaccion t = baseClienteCobro();
        t.setTipo_transaccion(TipoTransaccionEnum.PAGO);
        assertThrows(IllegalArgumentException.class, () -> service.crear(t));
    }

    @Test
    void crear_cliente_cobro_ok() {
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(200d);
        when(obraCostoClient.obtenerObra(1L)).thenReturn(obra);
        when(transaccionRepository.sumarCobrosPorObra(1L)).thenReturn(20d);
        when(transaccionRepository.save(any(Transaccion.class))).thenAnswer(invocation -> {
            Transaccion saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        TransaccionDto result = service.crear(baseClienteCobro());

        assertEquals(10L, result.getId());
        verify(transaccionRepository).save(transaccionCaptor.capture());
        assertEquals("CLIENTE", transaccionCaptor.getValue().getTipoAsociado());
    }

    @Test
    void crear_cobro_total_con_monto_incompleto_lanza_excepcion() {
        Transaccion t = baseClienteCobro();
        t.setForma_pago("TOTAL");
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(200d);
        when(obraCostoClient.obtenerObra(1L)).thenReturn(obra);
        when(transaccionRepository.sumarCobrosPorObra(1L)).thenReturn(20d);

        assertThrows(IllegalArgumentException.class, () -> service.crear(t));
    }

    @Test
    void actualizar_parcial_no_puede_completar_presupuesto() {
        Transaccion existente = baseClienteCobro();
        existente.setId(5L);
        existente.setMonto(10d);
        when(transaccionRepository.findById(5L)).thenReturn(Optional.of(existente));
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(100d);
        when(obraCostoClient.obtenerObra(1L)).thenReturn(obra);
        when(transaccionRepository.sumarCobrosPorObra(1L)).thenReturn(90d);

        Transaccion update = baseClienteCobro();
        update.setMonto(20d);

        assertThrows(IllegalArgumentException.class, () -> service.actualizar(5L, update));
    }

    @Test
    void listar_completa_pagado_restante_para_cliente_cobro() {
        Transaccion t = baseClienteCobro();
        t.setId(1L);
        when(transaccionRepository.findAll()).thenReturn(List.of(t));
        ObraResumenDto obra = new ObraResumenDto();
        obra.setPresupuesto(200d);
        when(obraCostoClient.obtenerObra(1L)).thenReturn(obra);
        when(transaccionRepository.sumarCobrosPorObra(1L)).thenReturn(50d);

        List<TransaccionDto> result = service.listar();

        assertEquals(1, result.size());
        assertEquals(50d, result.get(0).getPagado());
        assertEquals(150d, result.get(0).getRestante());
    }

    @Test
    void eliminar_no_existe_lanza_excepcion() {
        when(transaccionRepository.existsById(99L)).thenReturn(false);
        assertThrows(RuntimeException.class, () -> service.eliminar(99L));
    }

    @Test
    void desactivar_por_obra_llama_repo() {
        service.desactivarPorObra(7L);
        verify(transaccionRepository).softDeleteByObraId(7L);
    }
}
