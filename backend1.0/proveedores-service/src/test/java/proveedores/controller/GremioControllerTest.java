package proveedores.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import proveedores.entity.Gremio;
import proveedores.repository.ProveedorRepository;
import proveedores.service.GremioService;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GremioController.class)
class GremioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GremioService service;

    @MockBean
    private ProveedorRepository proveedorRepository;

    @Test
    void get_all_ok() throws Exception {
        Gremio g = new Gremio();
        g.setId(1L);
        g.setNombre("Gremio A");
        when(service.findAllActivos()).thenReturn(List.of(g));

        mockMvc.perform(get("/api/gremios"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].nombre").value("Gremio A"));
    }

    @Test
    void get_one_ok() throws Exception {
        Gremio g = new Gremio();
        g.setId(2L);
        when(service.findById(2L)).thenReturn(Optional.of(g));

        mockMvc.perform(get("/api/gremios/2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void get_one_not_found() throws Exception {
        when(service.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/gremios/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void create_ok() throws Exception {
        Gremio g = new Gremio();
        g.setId(3L);
        g.setNombre("Gremio B");
        when(service.save(any(Gremio.class))).thenReturn(g);

        mockMvc.perform(post("/api/gremios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(g)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L));
    }

    @Test
    void update_ok() throws Exception {
        Gremio g = new Gremio();
        g.setId(4L);
        g.setNombre("Gremio C");
        when(service.update(eq(4L), any(Gremio.class))).thenReturn(Optional.of(g));

        mockMvc.perform(put("/api/gremios/4")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(g)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(4L));
    }

    @Test
    void update_not_found() throws Exception {
        when(service.update(eq(10L), any(Gremio.class))).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/gremios/10")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Gremio())))
            .andExpect(status().isNotFound());
    }

    @Test
    void delete_ok() throws Exception {
        when(service.delete(5L)).thenReturn(true);

        mockMvc.perform(delete("/api/gremios/5"))
            .andExpect(status().isNoContent());
    }

    @Test
    void delete_not_found() throws Exception {
        when(service.delete(11L)).thenReturn(false);

        mockMvc.perform(delete("/api/gremios/11"))
            .andExpect(status().isNotFound());
    }
}
