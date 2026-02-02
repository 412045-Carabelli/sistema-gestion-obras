package com.obras.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obras.dto.TareaDTO;
import com.obras.enums.EstadoTareaEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraProveedorRepository;
import com.obras.repository.ObraRepository;
import com.obras.repository.TareaRepository;
import com.obras.service.TareaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TareasController.class)
class TareasControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TareaService svc;

    @MockBean
    private ObraRepository obraRepository;

    @MockBean
    private ObraCostoRepository obraCostoRepository;

    @MockBean
    private TareaRepository tareaRepository;

    @MockBean
    private ObraProveedorRepository obraProveedorRepository;

    @Test
    void listar_tareas_ok() throws Exception {
        TareaDTO dto = new TareaDTO();
        dto.setId(1L);
        when(svc.tareasDeObra(10L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/obras/tareas/10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void crear_tarea_setea_id_obra() throws Exception {
        TareaDTO dto = new TareaDTO();
        dto.setNombre("Tarea X");

        when(svc.crear(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/obras/tareas/20")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id_obra").value(20L));
    }

    @Test
    void actualizar_tarea_ok() throws Exception {
        TareaDTO dto = new TareaDTO();
        dto.setId(2L);

        when(svc.actualizar(eq(2L), any())).thenReturn(dto);

        mockMvc.perform(put("/api/obras/tareas/2")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void completar_tarea_ok() throws Exception {
        TareaDTO dto = new TareaDTO();
        dto.setEstado_tarea(EstadoTareaEnum.COMPLETADA);

        when(svc.completarTarea(3L)).thenReturn(dto);

        mockMvc.perform(put("/api/obras/tareas/3/completar"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado_tarea").value("COMPLETADA"));
    }

    @Test
    void eliminar_tarea_ok() throws Exception {
        mockMvc.perform(delete("/api/obras/tareas/4"))
            .andExpect(status().isOk());

        verify(svc).borrar(4L);
    }

    @Test
    void listar_por_proveedor_ok() throws Exception {
        TareaDTO dto = new TareaDTO();
        dto.setId(5L);
        when(svc.tareasDeProveedor(99L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/obras/tareas/proveedor/99"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(5L));
    }
}
