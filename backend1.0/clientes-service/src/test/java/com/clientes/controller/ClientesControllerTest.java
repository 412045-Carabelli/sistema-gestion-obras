package com.clientes.controller;

import com.clientes.entity.Cliente;
import com.clientes.entity.CondicionIva;
import com.clientes.repository.ClienteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ClientesController.class)
class ClientesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClienteRepository repo;

    @Test
    void crear_ok() throws Exception {
        Cliente cliente = new Cliente();
        cliente.setId(1L);
        cliente.setNombre("Cliente A");

        when(repo.save(any(Cliente.class))).thenReturn(cliente);

        mockMvc.perform(post("/api/clientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cliente)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.nombre").value("Cliente A"));
    }

    @Test
    void listar_ok() throws Exception {
        Cliente c1 = new Cliente();
        c1.setId(1L);
        when(repo.findAll()).thenReturn(List.of(c1));

        mockMvc.perform(get("/api/clientes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void obtener_ok() throws Exception {
        Cliente c1 = new Cliente();
        c1.setId(2L);
        when(repo.findById(2L)).thenReturn(Optional.of(c1));

        mockMvc.perform(get("/api/clientes/2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void obtener_no_encontrado() throws Exception {
        when(repo.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/clientes/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void actualizar_setea_id() throws Exception {
        Cliente body = new Cliente();
        body.setNombre("Cliente X");

        when(repo.save(any(Cliente.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/clientes/5")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5L))
            .andExpect(jsonPath("$.nombre").value("Cliente X"));

        verify(repo).save(any(Cliente.class));
    }

    @Test
    void eliminar_ok() throws Exception {
        mockMvc.perform(delete("/api/clientes/7"))
            .andExpect(status().isOk());

        verify(repo).deleteById(7L);
    }

    @Test
    void condiciones_iva_ok() throws Exception {
        mockMvc.perform(get("/api/clientes/condicion-iva"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(CondicionIva.values().length))
            .andExpect(jsonPath("$[?(@.name=='CONSUMIDOR_FINAL')].label", hasItem("Consumidor Final")));
    }
}
