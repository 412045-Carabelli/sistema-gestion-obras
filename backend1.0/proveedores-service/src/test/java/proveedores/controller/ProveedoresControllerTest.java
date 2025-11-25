package proveedores.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import proveedores.dto.MovimientoDTO;
import proveedores.dto.ProveedorDTO;
import proveedores.entity.Gremio;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.exception.ClaveInvalidaException;
import proveedores.service.ProveedorService;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProveedoresController.class)
class ProveedoresControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProveedorService service;

    @Test
    void crearProveedorDevuelve201() throws Exception {
        when(service.save(any(Proveedor.class))).thenAnswer(inv -> {
            Proveedor p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        ProveedorDTO dto = new ProveedorDTO(null, "Proveedor", "321", "Tipo", "Gremio", "Contacto", "123", "mail@test.com", "Dir", true, null, null, null);

        mockMvc.perform(post("/api/proveedores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void actualizarProveedorDevuelve200() throws Exception {
        when(service.update(eq(1L), any())).thenAnswer(inv -> {
            Proveedor p = inv.getArgument(1);
            p.setId(1L);
            return p;
        });

        ProveedorDTO dto = new ProveedorDTO(null, "Prov2", "321", "Tipo", "Gremio", "Contacto", "123", "mail@test.com", "Dir", true, null, null, null);

        mockMvc.perform(put("/api/proveedores/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Prov2"));
    }

    @Test
    void activarYDesactivarDevuelven200() throws Exception {
        mockMvc.perform(patch("/api/proveedores/1/desactivar"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/proveedores/1/activar"))
                .andExpect(status().isOk());
    }

    @Test
    void eliminarMovimientoConClaveValida() throws Exception {
        mockMvc.perform(delete("/api/proveedores/movimientos/5").param("clave", "OK"))
                .andExpect(status().isOk());
    }

    @Test
    void eliminarMovimientoConClaveInvalidaDevuelve403() throws Exception {
        Mockito.doThrow(new ClaveInvalidaException("bad"))
                .when(service).eliminarMovimiento(5L, "FAIL");

        mockMvc.perform(delete("/api/proveedores/movimientos/5").param("clave", "FAIL"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMovimientosIncluyeObraYEstadoPago() throws Exception {
        MovimientoDTO dto = MovimientoDTO.builder()
                .id(1L)
                .proveedorId(2L)
                .obraId(3L)
                .obraNombre("Obra Central")
                .descripcion("Compra")
                .monto(new BigDecimal("100"))
                .montoPagado(new BigDecimal("100"))
                .saldoPendiente(BigDecimal.ZERO)
                .estadoPago("Pagado")
                .build();
        when(service.listarMovimientos(2L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/proveedores/2/movimientos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].obraNombre").value("Obra Central"))
                .andExpect(jsonPath("$[0].estadoPago").value("Pagado"));
    }
}
