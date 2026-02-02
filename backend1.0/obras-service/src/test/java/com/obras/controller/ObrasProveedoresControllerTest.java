package com.obras.controller;

import com.obras.entity.ObraProveedor;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraProveedorRepository;
import com.obras.repository.ObraRepository;
import com.obras.repository.TareaRepository;
import com.obras.service.ObraProveedorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ObrasProveedoresController.class)
class ObrasProveedoresControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ObraProveedorService svc;

    @MockBean
    private ObraRepository obraRepository;

    @MockBean
    private ObraCostoRepository obraCostoRepository;

    @MockBean
    private TareaRepository tareaRepository;

    @MockBean
    private ObraProveedorRepository obraProveedorRepository;

    @Test
    void listar_proveedores_ok() throws Exception {
        ObraProveedor op = new ObraProveedor(1L, 2L);
        when(svc.proveedoresDeObra(1L)).thenReturn(List.of(op));

        mockMvc.perform(get("/api/obras/obra-proveedor/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].idProveedor").value(2L));
    }

    @Test
    void vincular_ok() throws Exception {
        mockMvc.perform(post("/api/obras/obra-proveedor/2/link/3"))
            .andExpect(status().isOk());

        verify(svc).vincularProveedor(2L, 3L);
    }

    @Test
    void desvincular_ok() throws Exception {
        mockMvc.perform(delete("/api/obras/obra-proveedor/4/unlink/5"))
            .andExpect(status().isOk());

        verify(svc).desvincularProveedor(4L, 5L);
    }
}
