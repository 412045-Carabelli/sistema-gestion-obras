package proveedores.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import proveedores.entity.Movimiento;
import proveedores.entity.Proveedor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ProveedorRepositoryTest {

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private MovimientoRepository movimientoRepository;

    @Autowired
    private TestEntityManager em;

    @Test
    void guardarProveedorConCamposNuevos() {
        Proveedor proveedor = crearProveedor();
        Proveedor saved = proveedorRepository.save(proveedor);
        em.flush();

        Optional<Proveedor> recuperado = proveedorRepository.findById(saved.getId());
        assertThat(recuperado).isPresent();
        assertThat(recuperado.get().getDniCuit()).isEqualTo("20123456789");
        assertThat(recuperado.get().getDireccion()).isEqualTo("Calle 123");
    }

    @Test
    void buscarPorDniCuit() {
        Proveedor proveedor = proveedorRepository.save(crearProveedor());
        em.flush();

        Optional<Proveedor> encontrado = proveedorRepository.findByDniCuit("20123456789");
        assertThat(encontrado).isPresent();
        assertThat(encontrado.get().getId()).isEqualTo(proveedor.getId());
    }

    @Test
    void softDeleteUpdate() {
        Proveedor proveedor = proveedorRepository.save(crearProveedor());
        proveedor.setActivo(false);
        proveedorRepository.save(proveedor);

        List<Proveedor> activos = proveedorRepository.findByActivoTrue();
        assertThat(activos).isEmpty();
    }

    @Test
    void obtenerMovimientosPendientes() {
        Proveedor proveedor = proveedorRepository.save(crearProveedor());

        Movimiento pagado = new Movimiento();
        pagado.setProveedor(proveedor);
        pagado.setMonto(new BigDecimal("100"));
        pagado.setMontoPagado(new BigDecimal("100"));
        pagado.setPagado(true);

        Movimiento pendiente = new Movimiento();
        pendiente.setProveedor(proveedor);
        pendiente.setMonto(new BigDecimal("200"));
        pendiente.setMontoPagado(new BigDecimal("50"));
        pendiente.setPagado(false);

        movimientoRepository.save(pagado);
        movimientoRepository.save(pendiente);

        List<Movimiento> pendientes = movimientoRepository.findByPagadoFalse();
        assertThat(pendientes).hasSize(1);
        assertThat(pendientes.get(0).getMonto()).isEqualByComparingTo("200");
    }

    private Proveedor crearProveedor() {
        Proveedor proveedor = new Proveedor();
        proveedor.setNombre("Proveedor Local");
        proveedor.setDniCuit("20123456789");
        proveedor.setDireccion("Calle 123");
        proveedor.setTipo("TipoX");
        proveedor.setGremio("GremioX");
        proveedor.setActivo(true);
        return proveedor;
    }
}
