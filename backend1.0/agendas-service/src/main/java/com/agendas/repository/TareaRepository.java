package com.agendas.repository;

import com.agendas.entity.Tarea;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findAllByOrderByCreadoEnAsc(Pageable pageable);
    List<Tarea> findByProveedorId(Long proveedorId);
}
