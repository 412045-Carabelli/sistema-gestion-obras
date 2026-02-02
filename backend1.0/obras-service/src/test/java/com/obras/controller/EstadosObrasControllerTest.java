package com.obras.controller;

import com.obras.enums.EstadoObraEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraProveedorRepository;
import com.obras.repository.ObraRepository;
import com.obras.repository.TareaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EstadosObrasController.class)
class EstadosObrasControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ObraRepository obraRepository;

    @MockBean
    private ObraCostoRepository obraCostoRepository;

    @MockBean
    private TareaRepository tareaRepository;

    @MockBean
    private ObraProveedorRepository obraProveedorRepository;

    @Test
    void estados_ok() throws Exception {
        mockMvc.perform(get("/api/obras/estados"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(EstadoObraEnum.values().length))
            .andExpect(jsonPath("$[0].name").exists())
            .andExpect(jsonPath("$[0].label").exists());
    }

    @Test
    void estado_formato_label() throws Exception {
        mockMvc.perform(get("/api/obras/estados"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.name=='EN_PROGRESO')].label", hasItem("En Progreso")));
    }
}
