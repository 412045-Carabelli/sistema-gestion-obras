package com.reportes.repository;

import com.reportes.entity.Comision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ComisionRepository extends JpaRepository<Comision, Long> {
    List<Comision> findByIdObra(Long idObra);

    List<Comision> findByFechaBetween(LocalDate desde, LocalDate hasta);
}
