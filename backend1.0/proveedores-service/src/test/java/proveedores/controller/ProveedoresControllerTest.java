package proveedores.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import proveedores.dto.ProveedorDTO;
import proveedores.entity.Gremio;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.repository.ProveedorRepository;
import proveedores.service.ProveedorService;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
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

    @MockBean
    private ProveedorRepository proveedorRepository;

    @Test
    void get_all_activos_ok() throws Exception {
        Proveedor p = new Proveedor();
        p.setId(1L);
        p.setNombre("Prov A");
        when(service.findAllActivos()).thenReturn(List.of(p));

        mockMvc.perform(get("/api/proveedores"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].nombre").value("Prov A"));
    }

    @Test
    void get_by_id_ok() throws Exception {
        Proveedor p = new Proveedor();
        p.setId(2L);
        when(service.findById(2L)).thenReturn(Optional.of(p));

        mockMvc.perform(get("/api/proveedores/2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void get_by_id_not_found() throws Exception {
        when(service.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/proveedores/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void get_all_sin_filtro_ok() throws Exception {
        Proveedor p = new Proveedor();
        p.setId(3L);
        when(service.findAll()).thenReturn(List.of(p));

        mockMvc.perform(get("/api/proveedores/all"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(3L));
    }

    @Test
    void create_ok() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov X");
        dto.setTipo_proveedor_id(10L);
        dto.setGremio_id(20L);
        TipoProveedor tipo = new TipoProveedor();
        tipo.setId(10L);
        tipo.setNombre("Tipo A");
        Gremio gremio = new Gremio();
        gremio.setId(20L);
        gremio.setNombre("Gremio A");
        when(service.findTipoById(10L)).thenReturn(Optional.of(tipo));
        when(service.findGremioById(20L)).thenReturn(Optional.of(gremio));
        Proveedor saved = new Proveedor();
        saved.setId(5L);
        saved.setNombre("Prov X");
        when(service.save(any(Proveedor.class))).thenReturn(saved);

        mockMvc.perform(post("/api/proveedores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5L))
            .andExpect(jsonPath("$.nombre").value("Prov X"));
    }

    @Test
    void create_bad_request() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov X");
        when(service.save(any(Proveedor.class))).thenThrow(new RuntimeException("error"));

        mockMvc.perform(post("/api/proveedores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void create_bad_request_si_tipo_no_existe() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov X");
        dto.setTipo_proveedor_id(99L);
        when(service.findTipoById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/proveedores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isBadRequest());

        verify(service, never()).save(any(Proveedor.class));
    }

    @Test
    void update_ok() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov Y");
        Proveedor updated = new Proveedor();
        updated.setId(6L);
        updated.setNombre("Prov Y");
        when(service.update(eq(6L), any(Proveedor.class))).thenReturn(updated);

        mockMvc.perform(put("/api/proveedores/6")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(6L))
            .andExpect(jsonPath("$.nombre").value("Prov Y"));
    }

    @Test
    void update_not_found() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        when(service.update(eq(7L), any(Proveedor.class))).thenThrow(new RuntimeException("no encontrado"));

        mockMvc.perform(put("/api/proveedores/7")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isNotFound());
    }

    @Test
    void update_not_found_si_gremio_no_existe() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov Z");
        dto.setGremio_id(88L);
        when(service.findGremioById(88L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/proveedores/8")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isNotFound());

        verify(service, never()).update(eq(8L), any(Proveedor.class));
    }

    @Test
    void delete_ok() throws Exception {
        mockMvc.perform(delete("/api/proveedores/8"))
            .andExpect(status().isNoContent());

        verify(service).delete(8L);
    }
}
