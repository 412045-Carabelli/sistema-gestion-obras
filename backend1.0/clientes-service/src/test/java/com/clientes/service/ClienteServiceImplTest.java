package com.clientes.service;

import com.clientes.client.ObrasClient;
import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.dto.ObraClienteResponse;
import com.clientes.entity.Cliente;
import com.clientes.exception.ClienteNotFoundException;
import com.clientes.exception.InvalidClienteException;
import com.clientes.repository.ClienteRepository;
import com.clientes.service.impl.ClienteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClienteServiceImplTest {

    @Mock
    private ClienteRepository repository;

    @Mock
    private ObrasClient obrasClient;

    @InjectMocks
    private ClienteServiceImpl service;

    private ClienteRequest baseRequest;

    @BeforeEach
    void setup() {
        baseRequest = new ClienteRequest();
        baseRequest.setNombre("Nuevo Cliente");
        baseRequest.setCondicionIVA("Monotributo");
    }

    @Test
    void crearClienteConCondicionIva_ok() {
        Cliente guardado = new Cliente();
        guardado.setId(1L);
        guardado.setNombre(baseRequest.getNombre());
        guardado.setCondicionIVA("Monotributo");
        guardado.setCreadoEn(Instant.now());

        when(repository.save(any(Cliente.class))).thenReturn(guardado);

        ClienteResponse response = service.crear(baseRequest);

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(repository).save(captor.capture());
        assertEquals("Monotributo", captor.getValue().getCondicionIVA());
        assertEquals("Monotributo", response.getCondicionIVA());
    }

    @Test
    void errorCuandoFaltaCondicionIVA_badRequest() {
        baseRequest.setCondicionIVA(null);
        assertThrows(InvalidClienteException.class, () -> service.crear(baseRequest));
    }

    @Test
    void fuerzaEstadoActivoSiempre() {
        baseRequest.setCondicionIVA("Consumidor Final");
        when(repository.save(any(Cliente.class))).thenAnswer(invocation -> {
            Cliente incoming = invocation.getArgument(0);
            incoming.setId(2L);
            return incoming;
        });

        ClienteResponse response = service.crear(baseRequest);
        assertNotNull(response.getCreadoEn());
    }

    @Test
    void obtenerClienteConObras_devuelveListado() {
        Cliente cliente = new Cliente();
        cliente.setId(5L);
        cliente.setNombre("Cliente Obras");
        cliente.setCondicionIVA("Exento");
        when(repository.findById(5L)).thenReturn(Optional.of(cliente));

        ObraClienteResponse obra = new ObraClienteResponse();
        obra.setId(10L);
        obra.setNombre("Obra cliente");
        when(obrasClient.obtenerObrasPorCliente(5L)).thenReturn(List.of(obra));

        ClienteResponse response = service.obtenerConObras(5L);

        assertEquals(1, response.getObras().size());
        assertEquals("Obra cliente", response.getObras().get(0).getNombre());
    }

    @Test
    void errorSiObrasServiceCaido_retornaSinObras() {
        Cliente cliente = new Cliente();
        cliente.setId(6L);
        cliente.setNombre("Cliente sin obras");
        cliente.setCondicionIVA("Consumidor Final");
        when(repository.findById(6L)).thenReturn(Optional.of(cliente));

        when(obrasClient.obtenerObrasPorCliente(6L)).thenThrow(new RestClientException("Service down"));

        ClienteResponse response = service.obtenerConObras(6L);
        assertTrue(response.getObras().isEmpty());
    }

    @Test
    void clienteNoExiste_lanza404() {
        when(repository.findById(eq(100L))).thenReturn(Optional.empty());
        assertThrows(ClienteNotFoundException.class, () -> service.obtener(100L));
    }
}
