package com.auth.repository;

import com.auth.entity.Suscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuscripcionRepository extends JpaRepository<Suscripcion, Long> {

    List<Suscripcion> findByOrganizacionId(Long organizacionId);

    @Query("""
        SELECT s FROM Suscripcion s
        WHERE s.organizacionId = :organizacionId
          AND s.estado IN ('ACTIVA', 'TRIAL')
        ORDER BY s.fechaInicio DESC
        """)
    Optional<Suscripcion> findActivaByOrganizacionId(@Param("organizacionId") Long organizacionId);

    @Query("""
        SELECT s FROM Suscripcion s
        WHERE s.estado IN ('ACTIVA', 'TRIAL')
          AND s.fechaVencimiento < CURRENT_TIMESTAMP
        """)
    List<Suscripcion> findVencidas();

    Optional<Suscripcion> findByMpPreapprovalId(String mpPreapprovalId);
}
