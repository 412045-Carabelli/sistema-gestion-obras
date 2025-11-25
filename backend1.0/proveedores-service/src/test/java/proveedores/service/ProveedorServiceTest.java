package proveedores.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import proveedores.dto.MovimientoDTO;
import proveedores.entity.Gremio;
import proveedores.entity.Movimiento;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.exception.ClaveInvalidaException;
import proveedores.integration.ObrasClient;
import proveedores.repository.GremioRepository;
import proveedores.repository.MovimientoRepository;
import proveedores.repository.ProveedorRepository;
import proveedores.repository.TipoProveedorRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProveedorServiceTest {

    @Mock
    private ProveedorRepository proveedorRepository;
    @Mock
    private TipoProveedorRepository tipoProveedorRepository;
    @Mock
    private GremioRepository gremioRepository;
    @Mock
    private MovimientoRepository movimientoRepository;
    @Mock
    private ObrasClient obrasClient;

    @InjectMocks
    private ProveedorService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "claveMovimientos", "SECRET");
    }

    @Test
    void crearProveedorConDniCuitObligatorio() {
        Proveedor proveedor = crearProveedor();
        when(proveedorRepository.save(any(Proveedor.class))).thenReturn(proveedor);

        Proveedor saved = service.save(proveedor);

        assertThat(saved.getDniCuit()).isEqualTo("123");
        verify(proveedorRepository).save(any(Proveedor.class));
    }

    @Test
    void errorSiDniCuitFalta() {
        Proveedor proveedor = crearProveedor();
        proveedor.setDniCuit(null);

        assertThatThrownBy(() -> service.save(proveedor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DNI/CUIT");
    }

    @Test
    void agregarTipoDinamico() {
        when(tipoProveedorRepository.findByNombreIgnoreCase("Construccion")).thenReturn(Optional.empty());
        when(tipoProveedorRepository.save(any(TipoProveedor.class))).thenAnswer(inv -> {
            TipoProveedor t = inv.getArgument(0);
            t.setId(1L);
            return t;
        });

        TipoProveedor tipo = service.agregarTipo("Construccion");

        assertThat(tipo.getNombre()).isEqualTo("Construccion");
        verify(tipoProveedorRepository).save(any(TipoProveedor.class));
    }

    @Test
    void agregarGremioDinamico() {
        when(gremioRepository.findByNombreIgnoreCase("Electricistas")).thenReturn(Optional.empty());
        when(gremioRepository.save(any(Gremio.class))).thenAnswer(inv -> {
            Gremio g = inv.getArgument(0);
            g.setId(2L);
            return g;
        });

        Gremio gremio = service.agregarGremio("Electricistas");

        assertThat(gremio.getNombre()).isEqualTo("Electricistas");
        verify(gremioRepository).save(any(Gremio.class));
    }

    @Test
    void activarYDesactivarProveedor() {
        Proveedor proveedor = crearProveedor();
        when(proveedorRepository.findById(5L)).thenReturn(Optional.of(proveedor));

        service.desactivar(5L);
        verify(proveedorRepository).save(proveedor);
        assertThat(proveedor.getActivo()).isFalse();

        service.activar(5L);
        verify(proveedorRepository, times(2)).save(proveedor);
        assertThat(proveedor.getActivo()).isTrue();
    }

    @Test
    void listarMovimientosConObra() {
        Proveedor proveedor = crearProveedor();
        proveedor.setId(1L);
        Movimiento mov = crearMovimiento(proveedor);
        mov.setObraId(10L);
        when(movimientoRepository.findByProveedorId(1L)).thenReturn(List.of(mov));
        when(obrasClient.obtenerNombreObra(10L)).thenReturn(Optional.of("Obra Centro"));

        List<MovimientoDTO> resultados = service.listarMovimientos(1L);

        assertThat(resultados).hasSize(1);
        assertThat(resultados.get(0).getObraNombre()).isEqualTo("Obra Centro");
        assertThat(resultados.get(0).getEstadoPago()).isEqualTo("Pagado");
    }

    @Test
    void listarMovimientosSinObraCuandoFallaRest() {
        Proveedor proveedor = crearProveedor();
        proveedor.setId(1L);
        Movimiento mov = crearMovimiento(proveedor);
        mov.setObraId(11L);
        when(movimientoRepository.findByProveedorId(1L)).thenReturn(List.of(mov));
        when(obrasClient.obtenerNombreObra(11L)).thenThrow(new RuntimeException("down"));

        List<MovimientoDTO> resultados = service.listarMovimientos(1L);

        assertThat(resultados.get(0).getObraNombre()).isNull();
    }

    @Test
    void calculaSaldoPendienteCorrectamente() {
        Proveedor proveedor = crearProveedor();
        proveedor.setId(1L);
        Movimiento mov = crearMovimiento(proveedor);
        mov.setPagado(false);
        mov.setMonto(new BigDecimal("100"));
        mov.setMontoPagado(new BigDecimal("40"));
        when(movimientoRepository.findByProveedorId(1L)).thenReturn(List.of(mov));
        when(obrasClient.obtenerNombreObra(any())).thenReturn(Optional.empty());

        MovimientoDTO dto = service.listarMovimientos(1L).get(0);

        assertThat(dto.getSaldoPendiente()).isEqualByComparingTo("60");
        assertThat(dto.getEstadoPago()).isEqualTo("Pendiente");
    }

    @Test
    void eliminarMovimientoConClaveValida() {
        service.eliminarMovimiento(3L, "SECRET");
        verify(movimientoRepository).deleteById(3L);
    }

    @Test
    void rechazarEliminacionConClaveInvalida() {
        assertThatThrownBy(() -> service.eliminarMovimiento(3L, "WRONG"))
                .isInstanceOf(ClaveInvalidaException.class);
        verify(movimientoRepository, never()).deleteById(any());
    }

    private Proveedor crearProveedor() {
        Proveedor proveedor = new Proveedor();
        proveedor.setNombre("Proveedor Test");
        proveedor.setDniCuit("123");
        proveedor.setActivo(true);
        return proveedor;
    }

    private Movimiento crearMovimiento(Proveedor proveedor) {
        Movimiento movimiento = new Movimiento();
        movimiento.setProveedor(proveedor);
        movimiento.setDescripcion("Compra");
        movimiento.setMonto(new BigDecimal("100"));
        movimiento.setMontoPagado(new BigDecimal("120"));
        movimiento.setPagado(true);
        return movimiento;
    }
}
