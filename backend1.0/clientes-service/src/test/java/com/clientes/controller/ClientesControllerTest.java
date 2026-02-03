package com.clientes.controller;

import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.entity.CondicionIva;
import com.clientes.exception.ClienteNotFoundException;
import com.clientes.service.ClienteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

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
    private ClienteService service;

    @Test
    void crear_ok() throws Exception {
        ClienteRequest request = new ClienteRequest();
        request.setNombre("Cliente A");
        request.setCondicionIVA("MONOTRIBUTO");
        ClienteResponse response = new ClienteResponse();
        response.setId(1L);
        response.setNombre("Cliente A");
        response.setCondicionIVA("MONOTRIBUTO");
        when(service.crear(any(ClienteRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/clientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.nombre").value("Cliente A"));
    }

    @Test
    void listar_ok() throws Exception {
        ClienteResponse c1 = new ClienteResponse();
        c1.setId(1L);
        when(service.listar()).thenReturn(List.of(c1));

        mockMvc.perform(get("/api/clientes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void obtener_ok() throws Exception {
        ClienteResponse c1 = new ClienteResponse();
        c1.setId(2L);
        when(service.obtenerConObras(2L)).thenReturn(c1);

        mockMvc.perform(get("/api/clientes/2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void obtener_no_encontrado() throws Exception {
        when(service.obtenerConObras(99L)).thenThrow(new ClienteNotFoundException(99L));

        mockMvc.perform(get("/api/clientes/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void actualizar_setea_id() throws Exception {
        ClienteRequest body = new ClienteRequest();
        body.setNombre("Cliente X");
        body.setCondicionIVA("MONOTRIBUTO");
        ClienteResponse response = new ClienteResponse();
        response.setId(5L);
        response.setNombre("Cliente X");
        when(service.actualizar(eq(5L), any(ClienteRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/clientes/5")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5L))
            .andExpect(jsonPath("$.nombre").value("Cliente X"));

        verify(service).actualizar(eq(5L), any(ClienteRequest.class));
    }

    @Test
    void eliminar_ok() throws Exception {
        mockMvc.perform(delete("/api/clientes/7"))
            .andExpect(status().isOk());

        verify(service).eliminar(7L);
    }

    @Test
    void condiciones_iva_ok() throws Exception {
        mockMvc.perform(get("/api/clientes/condicion-iva"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(CondicionIva.values().length))
            .andExpect(jsonPath("$[?(@.name=='CONSUMIDOR_FINAL')].label", hasItem("Consumidor Final")));
    }
}
