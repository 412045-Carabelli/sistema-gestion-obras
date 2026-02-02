package com.obras.controller;

import com.obras.dto.ProgresoDTO;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraProveedorRepository;
import com.obras.repository.ObraRepository;
import com.obras.repository.TareaRepository;
import com.obras.service.ProgresoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProgresosController.class)
class ProgresosControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProgresoService svc;

    @MockBean
    private ObraRepository obraRepository;

    @MockBean
    private ObraCostoRepository obraCostoRepository;

    @MockBean
    private TareaRepository tareaRepository;

    @MockBean
    private ObraProveedorRepository obraProveedorRepository;

    @Test
    void progreso_ok() throws Exception {
        ProgresoDTO dto = new ProgresoDTO(1L, 10, 7, new BigDecimal("70.00"));
        when(svc.calcularProgreso(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/obras/progreso/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id_obra").value(1L))
            .andExpect(jsonPath("$.porcentaje").value(70.00));
    }
}
