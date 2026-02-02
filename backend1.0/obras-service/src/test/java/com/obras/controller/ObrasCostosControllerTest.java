package com.obras.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obras.dto.ObraCostoDTO;
import com.obras.enums.EstadoPagoEnum;
import com.obras.enums.TipoCostoEnum;
import com.obras.repository.ObraCostoRepository;
import com.obras.repository.ObraProveedorRepository;
import com.obras.repository.ObraRepository;
import com.obras.repository.TareaRepository;
import com.obras.service.ObraCostoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ObrasCostosController.class)
class ObrasCostosControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ObraCostoService svc;

    @MockBean
    private ObraRepository obraRepository;

    @MockBean
    private ObraCostoRepository obraCostoRepository;

    @MockBean
    private TareaRepository tareaRepository;

    @MockBean
    private ObraProveedorRepository obraProveedorRepository;

    @Test
    void listar_costos_ok() throws Exception {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId(1L);
        when(svc.listarPorObra(10L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/obras/costos/10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void crear_costo_setea_id_obra() throws Exception {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setTipo_costo(TipoCostoEnum.ORIGINAL);
        dto.setCantidad(new BigDecimal("1"));
        dto.setPrecio_unitario(new BigDecimal("10"));

        when(svc.crear(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/obras/costos/20")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id_obra").value(20L));

        verify(svc).crear(any());
    }

    @Test
    void actualizar_estado_pago_ok() throws Exception {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setEstado_pago(EstadoPagoEnum.PAGADO);

        when(svc.actualizarEstadoPago(3L, EstadoPagoEnum.PAGADO)).thenReturn(dto);

        mockMvc.perform(put("/api/obras/costos/3/estado/PAGADO"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado_pago").value("PAGADO"));
    }

    @Test
    void actualizar_ok() throws Exception {
        ObraCostoDTO dto = new ObraCostoDTO();
        dto.setId(5L);

        when(svc.actualizar(eq(5L), any())).thenReturn(dto);

        mockMvc.perform(put("/api/obras/costos/5")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5L));
    }

    @Test
    void eliminar_ok() throws Exception {
        mockMvc.perform(delete("/api/obras/costos/7"))
            .andExpect(status().isOk());

        verify(svc).eliminar(7L);
    }
}
