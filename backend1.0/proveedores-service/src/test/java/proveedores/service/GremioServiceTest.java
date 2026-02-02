package proveedores.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import proveedores.entity.Gremio;
import proveedores.repository.GremioRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GremioServiceTest {

    @Mock
    private GremioRepository repo;

    @InjectMocks
    private GremioService service;

    @Captor
    private ArgumentCaptor<Gremio> gremioCaptor;

    @Test
    void find_all_activos() {
        when(repo.findByActivoTrue()).thenReturn(List.of(new Gremio(), new Gremio()));
        assertEquals(2, service.findAllActivos().size());
    }

    @Test
    void find_by_id_activo() {
        Gremio g = new Gremio();
        g.setId(1L);
        when(repo.findByIdAndActivoTrue(1L)).thenReturn(Optional.of(g));
        Optional<Gremio> result = service.findById(1L);
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void find_by_nombre() {
        Gremio g = new Gremio();
        g.setNombre("Alba");
        when(repo.findByNombreIgnoreCase("alba")).thenReturn(Optional.of(g));
        Optional<Gremio> result = service.findByNombre("alba");
        assertTrue(result.isPresent());
        assertEquals("Alba", result.get().getNombre());
    }

    @Test
    void save_setea_activo_true_si_null() {
        Gremio g = new Gremio();
        g.setNombre("G1");
        g.setActivo(null);
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Gremio saved = service.save(g);

        verify(repo).save(gremioCaptor.capture());
        assertTrue(Boolean.TRUE.equals(gremioCaptor.getValue().getActivo()));
        assertTrue(Boolean.TRUE.equals(saved.getActivo()));
    }

    @Test
    void update_actualiza_nombre_y_activo_si_viene() {
        Gremio existente = new Gremio();
        existente.setId(2L);
        existente.setNombre("Viejo");
        existente.setActivo(true);
        when(repo.findById(2L)).thenReturn(Optional.of(existente));
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Gremio req = new Gremio();
        req.setNombre("Nuevo");
        req.setActivo(false);

        Optional<Gremio> result = service.update(2L, req);

        assertTrue(result.isPresent());
        assertEquals("Nuevo", result.get().getNombre());
        assertFalse(Boolean.TRUE.equals(result.get().getActivo()));
    }

    @Test
    void update_activo_null_mantiene_valor() {
        Gremio existente = new Gremio();
        existente.setId(3L);
        existente.setNombre("Viejo");
        existente.setActivo(true);
        when(repo.findById(3L)).thenReturn(Optional.of(existente));
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Gremio req = new Gremio();
        req.setNombre("Nuevo");
        req.setActivo(null);

        Optional<Gremio> result = service.update(3L, req);

        assertTrue(result.isPresent());
        assertTrue(Boolean.TRUE.equals(result.get().getActivo()));
    }

    @Test
    void delete_desactiva_y_devuelve_true() {
        Gremio existente = new Gremio();
        existente.setId(4L);
        existente.setActivo(true);
        when(repo.findById(4L)).thenReturn(Optional.of(existente));
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = service.delete(4L);

        assertTrue(result);
        verify(repo).save(gremioCaptor.capture());
        assertFalse(Boolean.TRUE.equals(gremioCaptor.getValue().getActivo()));
    }

    @Test
    void delete_si_no_existe_devuelve_false() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        boolean result = service.delete(99L);
        assertFalse(result);
        verify(repo, never()).save(any());
    }
}
