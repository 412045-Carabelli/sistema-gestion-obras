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
import proveedores.service.GremioService;
import proveedores.service.ProveedorFinanzasService;
import proveedores.service.ProveedorService;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProveedoresBffController.class)
class ProveedoresBffControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProveedorService proveedorService;

    @MockBean
    private GremioService gremioService;

    @MockBean
    private ProveedorRepository proveedorRepository;

    @MockBean
    private ProveedorFinanzasService finanzasService;

    @Test
    void get_proveedores_ok() throws Exception {
        Proveedor p = new Proveedor();
        p.setId(1L);
        p.setNombre("Prov A");
        when(proveedorService.findAllActivos()).thenReturn(List.of(p));

        mockMvc.perform(get("/bff/proveedores"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].nombre").value("Prov A"));
    }

    @Test
    void get_proveedor_not_found() throws Exception {
        when(proveedorService.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/bff/proveedores/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void get_proveedor_ok() throws Exception {
        Proveedor p = new Proveedor();
        p.setId(2L);
        p.setNombre("Prov B");
        when(proveedorService.findById(2L)).thenReturn(Optional.of(p));
        when(finanzasService.calcularTotales(2L))
                .thenReturn(new ProveedorFinanzasService.TotalesProveedor(
                        java.math.BigDecimal.ZERO,
                        java.math.BigDecimal.ZERO,
                        java.math.BigDecimal.ZERO
                ));

        mockMvc.perform(get("/bff/proveedores/2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L))
            .andExpect(jsonPath("$.nombre").value("Prov B"));
    }

    @Test
    void create_proveedor_ok() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov C");
        dto.setTipo_proveedor_id(10L);
        dto.setGremio_id(20L);
        TipoProveedor tipo = new TipoProveedor();
        tipo.setId(10L);
        tipo.setNombre("Tipo A");
        Gremio gremio = new Gremio();
        gremio.setId(20L);
        gremio.setNombre("Gremio A");
        when(proveedorService.findTipoById(10L)).thenReturn(Optional.of(tipo));
        when(gremioService.findById(20L)).thenReturn(Optional.of(gremio));
        Proveedor saved = new Proveedor();
        saved.setId(3L);
        saved.setNombre("Prov C");
        when(proveedorService.save(any(Proveedor.class))).thenReturn(saved);

        mockMvc.perform(post("/bff/proveedores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.nombre").value("Prov C"));
    }

    @Test
    void create_proveedor_bad_request() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov X");
        when(proveedorService.save(any(Proveedor.class))).thenThrow(new RuntimeException("error"));

        mockMvc.perform(post("/bff/proveedores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void update_proveedor_ok() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov D");
        Proveedor updated = new Proveedor();
        updated.setId(4L);
        updated.setNombre("Prov D");
        when(proveedorService.update(eq(4L), any(Proveedor.class))).thenReturn(updated);

        mockMvc.perform(put("/bff/proveedores/4")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(4L))
            .andExpect(jsonPath("$.nombre").value("Prov D"));
    }

    @Test
    void update_proveedor_not_found() throws Exception {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setNombre("Prov Y");
        when(proveedorService.update(eq(10L), any(Proveedor.class))).thenThrow(new RuntimeException("no"));

        mockMvc.perform(put("/bff/proveedores/10")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isNotFound());
    }

    @Test
    void delete_proveedor_ok() throws Exception {
        mockMvc.perform(delete("/bff/proveedores/7"))
            .andExpect(status().isNoContent());
    }

    @Test
    void get_tipos_ok() throws Exception {
        TipoProveedor t = new TipoProveedor();
        t.setId(2L);
        t.setNombre("Albanil");
        when(proveedorService.findAllTipoActivos()).thenReturn(List.of(t));

        mockMvc.perform(get("/bff/tipo-proveedor"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(2L));
    }

    @Test
    void create_tipo_ok() throws Exception {
        TipoProveedor t = new TipoProveedor();
        t.setId(3L);
        t.setNombre("Pintor");
        when(proveedorService.saveTipo(any(TipoProveedor.class))).thenReturn(t);

        mockMvc.perform(post("/bff/tipo-proveedor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(t)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L));
    }

    @Test
    void get_gremios_ok() throws Exception {
        Gremio g = new Gremio();
        g.setId(4L);
        g.setNombre("Gremio A");
        when(gremioService.findAllActivos()).thenReturn(List.of(g));

        mockMvc.perform(get("/bff/gremios"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(4L));
    }

    @Test
    void create_gremio_ok() throws Exception {
        Gremio g = new Gremio();
        g.setId(5L);
        g.setNombre("Gremio B");
        when(gremioService.save(any(Gremio.class))).thenReturn(g);

        mockMvc.perform(post("/bff/gremios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(g)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5L));
    }
}
