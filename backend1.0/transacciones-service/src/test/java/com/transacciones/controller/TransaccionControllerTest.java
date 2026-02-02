package com.transacciones.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transacciones.dto.TransaccionDto;
import com.transacciones.enums.TipoTransaccionEnum;
import com.transacciones.repository.TransaccionRepository;
import com.transacciones.service.TransaccionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TransaccionController.class)
class TransaccionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TransaccionService transaccionService;

    @MockBean
    private TransaccionRepository transaccionRepository;

    @Test
    void listar_ok() throws Exception {
        TransaccionDto dto = TransaccionDto.builder().id(1L).build();
        when(transaccionService.listar()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/transacciones"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void listar_por_asociado_ok() throws Exception {
        TransaccionDto dto = TransaccionDto.builder().id(2L).build();
        when(transaccionService.findByTipoAsociado("CLIENTE", 10L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/transacciones/asociado/cliente/10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(2L));
    }

    @Test
    void obtener_ok() throws Exception {
        TransaccionDto dto = TransaccionDto.builder().id(3L).build();
        when(transaccionService.obtener(3L)).thenReturn(dto);

        mockMvc.perform(get("/api/transacciones/3"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L));
    }

    @Test
    void listar_por_obra_ok() throws Exception {
        TransaccionDto dto = TransaccionDto.builder().id(4L).build();
        when(transaccionService.listarPorObra(20L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/transacciones/obra/20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(4L));
    }

    @Test
    void inactivar_por_obra_ok() throws Exception {
        mockMvc.perform(patch("/api/transacciones/obra/30/inactivar"))
            .andExpect(status().isNoContent());
        verify(transaccionService).desactivarPorObra(30L);
    }

    @Test
    void crear_ok() throws Exception {
        TransaccionDto dto = TransaccionDto.builder()
                .id(5L)
                .id_obra(10L)
                .id_asociado(11L)
                .tipo_asociado("CLIENTE")
                .tipo_transaccion(TipoTransaccionEnum.COBRO)
                .fecha(LocalDate.now())
                .monto(100d)
                .forma_pago("PARCIAL")
                .build();
        when(transaccionService.crear(any())).thenReturn(dto);

        mockMvc.perform(post("/api/transacciones")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5L));
    }

    @Test
    void actualizar_ok() throws Exception {
        TransaccionDto dto = TransaccionDto.builder().id(6L).build();
        when(transaccionService.actualizar(eq(6L), any())).thenReturn(dto);

        mockMvc.perform(put("/api/transacciones/6")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(6L));
    }

    @Test
    void eliminar_ok() throws Exception {
        mockMvc.perform(delete("/api/transacciones/7"))
            .andExpect(status().isNoContent());
        verify(transaccionService).eliminar(7L);
    }
}
