package com.obras.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obras.dto.ObraDTO;
import com.obras.enums.EstadoObraEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraProveedorRepository;
import com.obras.repository.ObraRepository;
import com.obras.repository.TareaRepository;
import com.obras.service.ObraService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ObrasController.class)
class ObrasControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ObraService svc;

    @MockBean
    private ObraRepository obraRepository;

    @MockBean
    private ObraCostoRepository obraCostoRepository;

    @MockBean
    private TareaRepository tareaRepository;

    @MockBean
    private ObraProveedorRepository obraProveedorRepository;

    @Test
    void crear_ok() throws Exception {
        ObraDTO dto = new ObraDTO();
        dto.setId(1L);
        dto.setNombre("Obra A");
        dto.setPresupuesto(new BigDecimal("100.00"));

        when(svc.crear(any())).thenReturn(dto);

        mockMvc.perform(post("/api/obras")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.nombre").value("Obra A"));
    }

    @Test
    void get_encontrado() throws Exception {
        ObraDTO dto = new ObraDTO();
        dto.setId(2L);
        dto.setNombre("Obra B");

        when(svc.obtener(2L)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/obras/2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void get_no_encontrado() throws Exception {
        when(svc.obtener(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/obras/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void listar_ok() throws Exception {
        ObraDTO dto = new ObraDTO();
        dto.setId(3L);
        when(svc.listar(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/obras"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(3L));
    }

    @Test
    void actualizar_ok() throws Exception {
        ObraDTO dto = new ObraDTO();
        dto.setId(4L);
        dto.setNombre("Obra C");

        when(svc.actualizar(eq(4L), any())).thenReturn(dto);

        mockMvc.perform(put("/api/obras/4")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(4L));
    }

    @Test
    void cambiar_estado_ok() throws Exception {
        mockMvc.perform(patch("/api/obras/5/estado/EN_PROGRESO"))
            .andExpect(status().isOk());

        verify(svc).cambiarEstado(5L, EstadoObraEnum.EN_PROGRESO);
    }

    @Test
    void activar_ok() throws Exception {
        mockMvc.perform(patch("/api/obras/6/activo"))
            .andExpect(status().isOk());

        verify(svc).activar(6L);
    }
}
