package com.reportes.repository;

import com.reportes.entity.MovimientoReporte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MovimientoReporteRepository extends JpaRepository<MovimientoReporte, Long> {
    List<MovimientoReporte> findByFechaBetween(LocalDate desde, LocalDate hasta);
}
