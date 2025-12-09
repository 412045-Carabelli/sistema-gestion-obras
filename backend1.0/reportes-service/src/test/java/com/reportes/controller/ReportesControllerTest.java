package com.reportes.controller;

import com.reportes.dto.response.ComisionesResponse;
import com.reportes.dto.response.CuentaCorrienteObraResponse;
import com.reportes.dto.response.CuentaCorrienteProveedorResponse;
import com.reportes.service.ReportesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ReportesController.class)
class ReportesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportesService reportesService;

    @Test
    void cuentaCorrienteObraDevuelveOk() throws Exception {
        when(reportesService.generarCuentaCorrientePorObra(anyLong())).thenReturn(new CuentaCorrienteObraResponse());
        mockMvc.perform(get("/api/reportes/cuenta-corriente/obra/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void cuentaCorrienteProveedorDevuelveOk() throws Exception {
        when(reportesService.generarCuentaCorrientePorProveedor(anyLong())).thenReturn(new CuentaCorrienteProveedorResponse());
        mockMvc.perform(get("/api/reportes/cuenta-corriente/proveedor/2").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void comisionesObraDevuelveOk() throws Exception {
        when(reportesService.generarComisionesPorObra(anyLong())).thenReturn(new ComisionesResponse());
        mockMvc.perform(get("/api/reportes/comisiones/obra/3").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void comisionesGeneralDevuelveOk() throws Exception {
        ComisionesResponse response = new ComisionesResponse();
        response.setSaldo(BigDecimal.ZERO);
        when(reportesService.generarComisionesGeneral()).thenReturn(response);
        mockMvc.perform(get("/api/reportes/comisiones/general").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
