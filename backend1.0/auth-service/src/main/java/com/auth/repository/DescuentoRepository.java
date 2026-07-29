package com.auth.repository;

import com.auth.entity.Descuento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface DescuentoRepository extends JpaRepository<Descuento, Long> {
    Optional<Descuento> findByCodigo(String codigo);

    @Query("""
        SELECT d FROM Descuento d
        WHERE d.activo = true
          AND d.validoDesde <= :ahora
          AND (d.validoHasta IS NULL OR d.validoHasta >= :ahora)
          AND (d.maxUsos IS NULL OR d.usosActuales < d.maxUsos)
        """)
    List<Descuento> findVigentes(Instant ahora);
}
