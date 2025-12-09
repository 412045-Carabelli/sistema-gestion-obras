package com.clientes.controller;

import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.dto.ObraClienteResponse;
import com.clientes.exception.ClienteNotFoundException;
import com.clientes.service.ClienteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ClientesController.class)
class ClientesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClienteService clienteService;

    @Test
    void postCliente_crea201() throws Exception {
        ClienteResponse response = buildResponse();
        given(clienteService.crear(any(ClienteRequest.class))).willReturn(response);

        ClienteRequest request = new ClienteRequest();
        request.setNombre("Nuevo");
        request.setCondicionIVA("Monotributo");

        mockMvc.perform(post("/api/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void putCliente_actualiza200() throws Exception {
        ClienteResponse response = buildResponse();
        given(clienteService.actualizar(eq(1L), any(ClienteRequest.class))).willReturn(response);

        ClienteRequest request = new ClienteRequest();
        request.setNombre("Actualizado");
        request.setCondicionIVA("Exento");

        mockMvc.perform(put("/api/clientes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Cliente Test"));
    }

    @Test
    void getClienteObras_ok() throws Exception {
        ClienteResponse response = buildResponse();
        ObraClienteResponse obra = new ObraClienteResponse();
        obra.setId(1L);
        obra.setNombre("Obra 1");
        response.setObras(List.of(obra));
        given(clienteService.obtenerConObras(1L)).willReturn(response);

        mockMvc.perform(get("/api/clientes/1/obras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.obras[0].nombre").value("Obra 1"));
    }

    @Test
    void getClienteNoExiste_404() throws Exception {
        given(clienteService.obtener(99L)).willThrow(new ClienteNotFoundException(99L));

        mockMvc.perform(get("/api/clientes/99"))
                .andExpect(status().isNotFound());
    }

    private ClienteResponse buildResponse() {
        ClienteResponse response = new ClienteResponse();
        response.setId(1L);
        response.setNombre("Cliente Test");
        response.setCondicionIVA("Monotributo");
        response.setCreadoEn(Instant.now());
        response.setObras(Collections.emptyList());
        return response;
    }
}
