package com.transacciones.service;

import com.transacciones.entity.TipoTransaccion;
import com.transacciones.repository.TipoTransaccionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TipoTransaccionServiceTest {

    @Mock
    private TipoTransaccionRepository repo;

    @InjectMocks
    private TipoTransaccionService service;

    @Test
    void listar_ok() {
        when(repo.findAll()).thenReturn(List.of(new TipoTransaccion(), new TipoTransaccion()));
        assertEquals(2, service.listar().size());
    }

    @Test
    void crear_ok() {
        TipoTransaccion tipo = new TipoTransaccion();
        tipo.setNombre("cobro");
        when(repo.save(org.mockito.ArgumentMatchers.<TipoTransaccion>any())).thenReturn(tipo);
        TipoTransaccion result = service.crear(tipo);
        assertEquals("cobro", result.getNombre());
    }

    @Test
    void obtener_ok() {
        TipoTransaccion tipo = new TipoTransaccion();
        tipo.setId(1L);
        when(repo.findById(1L)).thenReturn(Optional.of(tipo));
        TipoTransaccion result = service.obtener(1L);
        assertEquals(1L, result.getId());
    }

    @Test
    void obtener_no_encontrado_lanza_excepcion() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.obtener(99L));
    }
}
