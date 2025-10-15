package proveedores.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import proveedores.entity.TipoProveedor;

import java.util.List;
import java.util.Optional;

public interface TipoProveedorRepository extends JpaRepository<TipoProveedor, Long> {
    List<TipoProveedor> findByActivoTrue();

    Optional<TipoProveedor> findByIdAndActivoTrue(Long id);
}
