package com.obras.repository;

import com.obras.entity.ObraCosto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ObraCostoRepository extends JpaRepository<ObraCosto, Long> {
    List<ObraCosto> findByObra_IdAndActivoTrue(Long obraId);
    Optional<ObraCosto> findByIdAndActivoTrue(Long id);
}
