package com.transacciones.controller;

import com.transacciones.enums.TipoTransaccionEnum;
import com.transacciones.repository.TransaccionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TipoTransaccionController.class)
class TipoTransaccionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TransaccionRepository transaccionRepository;

    @Test
    void listar_ok() throws Exception {
        mockMvc.perform(get("/api/transacciones/tipo-transaccion"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(TipoTransaccionEnum.values().length))
            .andExpect(jsonPath("$[0].name").exists())
            .andExpect(jsonPath("$[0].label").exists());
    }

    @Test
    void obtener_tipo_ok() throws Exception {
        mockMvc.perform(get("/api/transacciones/tipo-transaccion/COBRO"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("COBRO"))
            .andExpect(jsonPath("$.label").value("Cobro"));
    }

    @Test
    void obtener_tipo_no_encontrado() throws Exception {
        mockMvc.perform(get("/api/transacciones/tipo-transaccion/INVALIDO"))
            .andExpect(status().isNotFound());
    }
}
