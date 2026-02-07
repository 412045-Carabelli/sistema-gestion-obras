package com.obras.repository;

import com.obras.entity.ObraCosto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ObraCostoRepository extends JpaRepository<ObraCosto, Long> {
    List<ObraCosto> findByObra_IdAndActivoTrue(Long obraId);
    List<ObraCosto> findByObra_Id(Long obraId);
    Optional<ObraCosto> findByIdAndActivoTrue(Long id);

    @Modifying
    @Query("update ObraCosto c set c.activo = false, c.bajaObra = true where c.obra.id = :obraId and c.activo = true")
    int desactivarPorObra(@Param("obraId") Long obraId);

    @Modifying
    @Query("update ObraCosto c set c.activo = true, c.bajaObra = false where c.obra.id = :obraId and c.activo = false and c.bajaObra = true")
    int activarPorObra(@Param("obraId") Long obraId);
}
