package proveedores.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import proveedores.entity.Proveedor;

import java.util.List;
import java.util.Optional;

public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    List<Proveedor> findByActivoTrue();
    List<Proveedor> findByActivoTrueAndEmpresaId(Long empresaId);

    Optional<Proveedor> findByIdAndActivoTrue(Long id);

    Optional<Proveedor> findByDniCuit(String dniCuit);
}
