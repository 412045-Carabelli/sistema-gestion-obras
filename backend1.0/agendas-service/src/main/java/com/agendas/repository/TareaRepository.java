package com.agendas.repository;

import com.agendas.entity.EstadoTarea;
import com.agendas.entity.Tarea;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findAllByOrderByCreadoEnAsc(Pageable pageable);
    List<Tarea> findByProveedorId(Long proveedorId);

    @Query("SELECT t FROM Tarea t WHERE t.fechaVencimiento BETWEEN :desde AND :hasta AND t.estado <> :estadoExcluir")
    List<Tarea> findVencimientosProximos(
        @Param("desde") Instant desde,
        @Param("hasta") Instant hasta,
        @Param("estadoExcluir") EstadoTarea estadoExcluir
    );
}
