package proveedores.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import proveedores.entity.Gremio;

import java.util.List;
import java.util.Optional;

public interface GremioRepository extends JpaRepository<Gremio, Long> {
    List<Gremio> findByActivoTrue();

    Optional<Gremio> findByNombreIgnoreCase(String nombre);
}
