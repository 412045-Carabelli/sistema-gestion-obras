package proveedores.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import proveedores.entity.Gremio;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.repository.GremioRepository;
import proveedores.repository.ProveedorRepository;
import proveedores.repository.TipoProveedorRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProveedorServiceTest {

    @Mock
    private ProveedorRepository repository;

    @Mock
    private TipoProveedorRepository tipoProveedorRepo;

    @Mock
    private GremioRepository gremioRepo;

    @InjectMocks
    private ProveedorService service;

    @Captor
    private ArgumentCaptor<TipoProveedor> tipoCaptor;

    @Captor
    private ArgumentCaptor<Proveedor> proveedorCaptor;

    @Test
    void find_all_tipo_activos() {
        when(tipoProveedorRepo.findByActivoTrue()).thenReturn(List.of(new TipoProveedor()));
        assertEquals(1, service.findAllTipoActivos().size());
    }

    @Test
    void save_tipo_fuerza_activo_true() {
        TipoProveedor tipo = new TipoProveedor();
        tipo.setNombre("X");
        tipo.setActivo(false);
        when(tipoProveedorRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TipoProveedor saved = service.saveTipo(tipo);

        verify(tipoProveedorRepo).save(tipoCaptor.capture());
        assertTrue(Boolean.TRUE.equals(tipoCaptor.getValue().getActivo()));
        assertTrue(Boolean.TRUE.equals(saved.getActivo()));
    }

    @Test
    void update_tipo_actualiza_nombre_y_activo_si_viene() {
        TipoProveedor existente = new TipoProveedor();
        existente.setId(1L);
        existente.setNombre("Viejo");
        existente.setActivo(true);
        when(tipoProveedorRepo.findByIdAndActivoTrue(1L)).thenReturn(Optional.of(existente));
        when(tipoProveedorRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TipoProveedor req = new TipoProveedor();
        req.setNombre("Nuevo");
        req.setActivo(false);

        Optional<TipoProveedor> result = service.updateTipo(1L, req);

        assertTrue(result.isPresent());
        assertEquals("Nuevo", result.get().getNombre());
        assertFalse(Boolean.TRUE.equals(result.get().getActivo()));
    }

    @Test
    void update_tipo_con_activo_null_mantiene_valor() {
        TipoProveedor existente = new TipoProveedor();
        existente.setId(2L);
        existente.setNombre("Viejo");
        existente.setActivo(true);
        when(tipoProveedorRepo.findByIdAndActivoTrue(2L)).thenReturn(Optional.of(existente));
        when(tipoProveedorRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TipoProveedor req = new TipoProveedor();
        req.setNombre("Nuevo");
        req.setActivo(null);

        Optional<TipoProveedor> result = service.updateTipo(2L, req);

        assertTrue(result.isPresent());
        assertTrue(Boolean.TRUE.equals(result.get().getActivo()));
    }

    @Test
    void delete_tipo_desactiva_y_devuelve_true() {
        TipoProveedor existente = new TipoProveedor();
        existente.setId(3L);
        existente.setActivo(true);
        when(tipoProveedorRepo.findByIdAndActivoTrue(3L)).thenReturn(Optional.of(existente));
        when(tipoProveedorRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = service.deleteTipo(3L);

        assertTrue(result);
        verify(tipoProveedorRepo).save(tipoCaptor.capture());
        assertFalse(Boolean.TRUE.equals(tipoCaptor.getValue().getActivo()));
    }

    @Test
    void delete_tipo_si_no_existe_devuelve_false() {
        when(tipoProveedorRepo.findByIdAndActivoTrue(99L)).thenReturn(Optional.empty());
        boolean result = service.deleteTipo(99L);
        assertFalse(result);
        verify(tipoProveedorRepo, never()).save(any());
    }

    @Test
    void save_proveedor_fuerza_activo_true() {
        Proveedor proveedor = new Proveedor();
        proveedor.setNombre("P");
        proveedor.setActivo(false);
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Proveedor saved = service.save(proveedor);

        verify(repository).save(proveedorCaptor.capture());
        assertTrue(Boolean.TRUE.equals(proveedorCaptor.getValue().getActivo()));
        assertTrue(Boolean.TRUE.equals(saved.getActivo()));
    }

    @Test
    void update_proveedor_actualiza_campos_y_relaciones_si_vienen() {
        Proveedor existente = new Proveedor();
        existente.setId(1L);
        existente.setNombre("Viejo");
        TipoProveedor tipoViejo = new TipoProveedor();
        tipoViejo.setNombre("TipoViejo");
        existente.setTipoProveedor(tipoViejo);
        Gremio gremioViejo = new Gremio();
        gremioViejo.setNombre("GremioViejo");
        existente.setGremio(gremioViejo);
        existente.setActivo(true);
        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Proveedor req = new Proveedor();
        req.setNombre("Nuevo");
        req.setDniCuit("20");
        req.setDireccion("Dir");
        req.setContacto("Contacto");
        req.setTelefono("123");
        req.setEmail("a@b.com");
        TipoProveedor tipoNuevo = new TipoProveedor();
        tipoNuevo.setNombre("TipoNuevo");
        Gremio gremioNuevo = new Gremio();
        gremioNuevo.setNombre("GremioNuevo");
        req.setTipoProveedor(tipoNuevo);
        req.setGremio(gremioNuevo);
        req.setActivo(false);

        Proveedor updated = service.update(1L, req);

        assertEquals("Nuevo", updated.getNombre());
        assertEquals("20", updated.getDniCuit());
        assertEquals("TipoNuevo", updated.getTipoProveedor().getNombre());
        assertEquals("GremioNuevo", updated.getGremio().getNombre());
        assertFalse(Boolean.TRUE.equals(updated.getActivo()));
    }

    @Test
    void update_proveedor_con_nulls_mantiene_relaciones_y_activo() {
        Proveedor existente = new Proveedor();
        existente.setId(2L);
        TipoProveedor tipoViejo = new TipoProveedor();
        tipoViejo.setNombre("TipoViejo");
        existente.setTipoProveedor(tipoViejo);
        Gremio gremioViejo = new Gremio();
        gremioViejo.setNombre("GremioViejo");
        existente.setGremio(gremioViejo);
        existente.setActivo(true);
        when(repository.findById(2L)).thenReturn(Optional.of(existente));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Proveedor req = new Proveedor();
        req.setNombre("Nuevo");
        req.setTipoProveedor(null);
        req.setGremio(null);
        req.setActivo(null);

        Proveedor updated = service.update(2L, req);

        assertEquals("TipoViejo", updated.getTipoProveedor().getNombre());
        assertEquals("GremioViejo", updated.getGremio().getNombre());
        assertTrue(Boolean.TRUE.equals(updated.getActivo()));
    }

    @Test
    void update_proveedor_no_encontrado_lanza_excepcion() {
        when(repository.findById(9L)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.update(9L, new Proveedor()));
        assertEquals("Proveedor no encontrado", ex.getMessage());
    }

    @Test
    void delete_proveedor_desactiva_si_existe() {
        Proveedor existente = new Proveedor();
        existente.setId(7L);
        existente.setActivo(true);
        when(repository.findById(7L)).thenReturn(Optional.of(existente));

        service.delete(7L);

        verify(repository).save(proveedorCaptor.capture());
        assertFalse(Boolean.TRUE.equals(proveedorCaptor.getValue().getActivo()));
    }

    @Test
    void find_all_activos() {
        when(repository.findByActivoTrue()).thenReturn(List.of(new Proveedor(), new Proveedor()));
        assertEquals(2, service.findAllActivos().size());
    }
}
