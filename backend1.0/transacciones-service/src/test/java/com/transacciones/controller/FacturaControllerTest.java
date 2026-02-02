package com.transacciones.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transacciones.dto.FacturaDto;
import com.transacciones.repository.TransaccionRepository;
import com.transacciones.service.FacturaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FacturaController.class)
class FacturaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FacturaService facturaService;

    @MockBean
    private TransaccionRepository transaccionRepository;

    @Test
    void listar_ok() throws Exception {
        FacturaDto dto = FacturaDto.builder().id(1L).build();
        when(facturaService.listar()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/facturas"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void obtener_ok() throws Exception {
        FacturaDto dto = FacturaDto.builder().id(2L).build();
        when(facturaService.obtener(2L)).thenReturn(dto);

        mockMvc.perform(get("/api/facturas/2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void listar_por_cliente_ok() throws Exception {
        FacturaDto dto = FacturaDto.builder().id(3L).build();
        when(facturaService.listarPorCliente(10L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/facturas/cliente/10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(3L));
    }

    @Test
    void listar_por_obra_ok() throws Exception {
        FacturaDto dto = FacturaDto.builder().id(4L).build();
        when(facturaService.listarPorObra(20L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/facturas/obra/20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(4L));
    }

    @Test
    void crear_ok_multipart() throws Exception {
        FacturaDto response = FacturaDto.builder().id(5L).build();
        when(facturaService.crear(any(FacturaDto.class), any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile("file", "factura.pdf", "application/pdf", "data".getBytes());

        mockMvc.perform(multipart("/api/facturas")
                .file(file)
                .param("id_cliente", "1")
                .param("id_obra", "2")
                .param("monto", "100.5")
                .param("monto_restante", "50.0")
                .param("fecha", LocalDate.now().toString())
                .param("descripcion", "desc")
                .param("estado", "EMITIDA")
                .param("impacta_cta_cte", "true"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5L));
    }

    @Test
    void actualizar_ok_multipart() throws Exception {
        FacturaDto response = FacturaDto.builder().id(6L).build();
        when(facturaService.actualizar(eq(6L), any(FacturaDto.class), any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile("file", "factura.pdf", "application/pdf", "data".getBytes());

        mockMvc.perform(multipart("/api/facturas/6")
                .file(file)
                .param("id_cliente", "1")
                .param("id_obra", "2")
                .param("monto", "100.5")
                .param("monto_restante", "50.0")
                .param("fecha", LocalDate.now().toString())
                .param("descripcion", "desc")
                .param("estado", "COBRADA")
                .param("impacta_cta_cte", "false")
                .with(req -> {
                    req.setMethod("PUT");
                    return req;
                }))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(6L));
    }

    @Test
    void eliminar_ok() throws Exception {
        mockMvc.perform(delete("/api/facturas/7"))
            .andExpect(status().isNoContent());
        verify(facturaService).eliminar(7L);
    }

    @Test
    void descargar_ok() throws Exception {
        Resource resource = new ByteArrayResource("data".getBytes());
        ResponseEntity<Resource> response = ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
        when(facturaService.descargarArchivo(8L)).thenReturn(response);

        mockMvc.perform(get("/api/facturas/8/download"))
            .andExpect(status().isOk());
    }
}
