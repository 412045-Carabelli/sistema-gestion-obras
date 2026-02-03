package com.clientes.service.impl;

import com.clientes.client.ObrasClient;
import com.clientes.client.TransaccionesClient;
import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.dto.ObraClienteResponse;
import com.clientes.entity.Cliente;
import com.clientes.exception.ClienteNotFoundException;
import com.clientes.exception.InvalidClienteException;
import com.clientes.repository.ClienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClienteServiceImplTest {

    @Mock
    private ClienteRepository repository;

    @Mock
    private ObrasClient obrasClient;

    @Mock
    private TransaccionesClient transaccionesClient;

    @InjectMocks
    private ClienteServiceImpl service;

    @Captor
    private ArgumentCaptor<Cliente> clienteCaptor;

    private ClienteRequest baseRequest;

    @BeforeEach
    void setup() {
        baseRequest = new ClienteRequest();
        baseRequest.setNombre("Cliente A");
        baseRequest.setIdEmpresa(10L);
        baseRequest.setContacto("Contacto");
        baseRequest.setDireccion("Direccion");
        baseRequest.setCuit("20-12345678-9");
        baseRequest.setTelefono("123");
        baseRequest.setEmail("a@b.com");
        baseRequest.setCondicionIVA("MONOTRIBUTO");
    }

    @Test
    void crear_ok_setea_creado_en_y_activo_default() {
        when(repository.save(any(Cliente.class))).thenAnswer(invocation -> {
            Cliente c = invocation.getArgument(0);
            c.setId(1L);
            return c;
        });

        ClienteResponse response = service.crear(baseRequest);

        verify(repository).save(clienteCaptor.capture());
        Cliente guardado = clienteCaptor.getValue();
        assertNotNull(guardado.getCreadoEn());
        assertTrue(Boolean.TRUE.equals(guardado.getActivo()));
        assertEquals("Cliente A", guardado.getNombre());

        assertEquals(1L, response.getId());
        assertEquals("MONOTRIBUTO", response.getCondicionIVA());
        assertTrue(Boolean.TRUE.equals(response.getActivo()));
    }

    @Test
    void crear_condicion_iva_invalida_lanza_excepcion() {
        baseRequest.setCondicionIVA("INVALIDA");
        assertThrows(InvalidClienteException.class, () -> service.crear(baseRequest));
        verify(repository, never()).save(any());
    }

    @Test
    void crear_condicion_iva_vacia_lanza_excepcion() {
        baseRequest.setCondicionIVA(" ");
        assertThrows(InvalidClienteException.class, () -> service.crear(baseRequest));
        verify(repository, never()).save(any());
    }

    @Test
    void actualizar_ok_modifica_campos_y_persiste() {
        Cliente existente = new Cliente();
        existente.setId(5L);
        existente.setNombre("Viejo");
        existente.setActivo(false);
        when(repository.findById(5L)).thenReturn(Optional.of(existente));
        when(repository.save(any(Cliente.class))).thenAnswer(invocation -> invocation.getArgument(0));

        baseRequest.setNombre("Nuevo");
        baseRequest.setActivo(null);

        ClienteResponse response = service.actualizar(5L, baseRequest);

        verify(repository).save(clienteCaptor.capture());
        Cliente actualizado = clienteCaptor.getValue();
        assertEquals("Nuevo", actualizado.getNombre());
        assertFalse(Boolean.TRUE.equals(actualizado.getActivo()));
        assertEquals("Nuevo", response.getNombre());
    }

    @Test
    void actualizar_no_encontrado_lanza_excepcion() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ClienteNotFoundException.class, () -> service.actualizar(99L, baseRequest));
    }

    @Test
    void obtener_ok_mapea_respuesta() {
        Cliente cliente = new Cliente();
        cliente.setId(7L);
        cliente.setNombre("Cliente B");
        cliente.setCreadoEn(Instant.now());
        when(repository.findById(7L)).thenReturn(Optional.of(cliente));

        ClienteResponse response = service.obtener(7L);

        assertEquals(7L, response.getId());
        assertEquals("Cliente B", response.getNombre());
    }

    @Test
    void obtener_no_encontrado_lanza_excepcion() {
        when(repository.findById(2L)).thenReturn(Optional.empty());
        assertThrows(ClienteNotFoundException.class, () -> service.obtener(2L));
    }

    @Test
    void obtener_con_obras_ok() {
        Cliente cliente = new Cliente();
        cliente.setId(3L);
        cliente.setNombre("Cliente C");
        when(repository.findById(3L)).thenReturn(Optional.of(cliente));
        when(obrasClient.obtenerObrasPorCliente(3L)).thenReturn(List.of(new ObraClienteResponse()));
        when(transaccionesClient.obtenerTransaccionesPorAsociado("CLIENTE", 3L)).thenReturn(List.of());

        ClienteResponse response = service.obtenerConObras(3L);

        assertNotNull(response.getObras());
        assertEquals(1, response.getObras().size());
    }

    @Test
    void obtener_con_obras_fallback_si_falla_client() {
        Cliente cliente = new Cliente();
        cliente.setId(4L);
        cliente.setNombre("Cliente D");
        when(repository.findById(4L)).thenReturn(Optional.of(cliente));
        when(obrasClient.obtenerObrasPorCliente(4L)).thenThrow(new RuntimeException("boom"));
        when(transaccionesClient.obtenerTransaccionesPorAsociado("CLIENTE", 4L)).thenReturn(List.of());

        ClienteResponse response = service.obtenerConObras(4L);

        assertNotNull(response.getObras());
        assertTrue(response.getObras().isEmpty());
    }

    @Test
    void listar_ok() {
        Cliente c1 = new Cliente();
        c1.setId(1L);
        Cliente c2 = new Cliente();
        c2.setId(2L);
        when(repository.findAll()).thenReturn(List.of(c1, c2));

        List<ClienteResponse> result = service.listar();

        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void listar_condiciones_iva_contiene_valores() {
        List<String> condiciones = service.listarCondicionesIva();
        assertTrue(condiciones.contains("MONOTRIBUTO"));
        assertTrue(condiciones.contains("RESPONSABLE_INSCRIPTO"));
        assertTrue(condiciones.contains("EXENTO"));
        assertTrue(condiciones.contains("CONSUMIDOR_FINAL"));
    }

    @Test
    void activar_desactivar_actualizan_activo() {
        Cliente cliente = new Cliente();
        cliente.setId(8L);
        cliente.setActivo(false);
        when(repository.findById(8L)).thenReturn(Optional.of(cliente));

        service.activar(8L);
        verify(repository).save(clienteCaptor.capture());
        assertTrue(Boolean.TRUE.equals(clienteCaptor.getValue().getActivo()));

        cliente.setActivo(true);
        service.desactivar(8L);
        verify(repository, times(2)).save(clienteCaptor.capture());
        assertFalse(Boolean.TRUE.equals(clienteCaptor.getValue().getActivo()));
    }
}
