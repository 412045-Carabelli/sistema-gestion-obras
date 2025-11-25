package proveedores.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import proveedores.entity.Movimiento;

import java.util.List;

public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    List<Movimiento> findByProveedorId(Long proveedorId);

    List<Movimiento> findByPagadoFalse();

    void deleteByObraId(Long obraId);
}
