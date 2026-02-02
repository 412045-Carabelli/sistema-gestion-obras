package proveedores.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import proveedores.entity.TipoProveedor;
import proveedores.repository.ProveedorRepository;
import proveedores.service.ProveedorService;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TipoProveedorController.class)
class TipoProveedorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProveedorService service;

    @MockBean
    private ProveedorRepository proveedorRepository;

    @Test
    void get_all_ok() throws Exception {
        TipoProveedor t = new TipoProveedor();
        t.setId(1L);
        t.setNombre("Albanil");
        when(service.findAllTipoActivos()).thenReturn(List.of(t));

        mockMvc.perform(get("/api/proveedores/tipo-proveedor"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].nombre").value("Albanil"));
    }

    @Test
    void create_ok() throws Exception {
        TipoProveedor t = new TipoProveedor();
        t.setId(2L);
        t.setNombre("Electricista");
        when(service.saveTipo(any(TipoProveedor.class))).thenReturn(t);

        mockMvc.perform(post("/api/proveedores/tipo-proveedor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(t)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void update_ok() throws Exception {
        TipoProveedor t = new TipoProveedor();
        t.setId(3L);
        t.setNombre("Plomero");
        when(service.updateTipo(eq(3L), any(TipoProveedor.class))).thenReturn(Optional.of(t));

        mockMvc.perform(put("/api/proveedores/tipo-proveedor/3")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(t)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L));
    }

    @Test
    void update_not_found() throws Exception {
        when(service.updateTipo(eq(9L), any(TipoProveedor.class))).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/proveedores/tipo-proveedor/9")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new TipoProveedor())))
            .andExpect(status().isNotFound());
    }

    @Test
    void delete_ok() throws Exception {
        when(service.deleteTipo(4L)).thenReturn(true);

        mockMvc.perform(delete("/api/proveedores/tipo-proveedor/4"))
            .andExpect(status().isNoContent());
    }

    @Test
    void delete_not_found() throws Exception {
        when(service.deleteTipo(10L)).thenReturn(false);

        mockMvc.perform(delete("/api/proveedores/tipo-proveedor/10"))
            .andExpect(status().isNotFound());
    }
}
