package com.obras.repository;

import com.obras.entity.Tarea;
import com.obras.enums.EstadoTareaEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findByIdObraAndActivoTrueOrderByFechaInicioAscCreadoEnAsc(Long idObra);

    Optional<Tarea> findByIdAndActivoTrue(Long id);

    long countByIdObraAndActivoTrue(Long idObra);

    List<Tarea> findByIdProveedorAndActivoTrue(Long idProveedor);

    long countByIdObraAndEstadoTareaAndActivoTrue(Long idObra, EstadoTareaEnum estado);

    @Query("select coalesce(sum(t.porcentaje),0) from Tarea t where t.idObra = :idObra and t.activo = true")
    Double sumPorcentajeByObra(@Param("idObra") Long idObra);

    @Query("select coalesce(sum(t.porcentaje),0) from Tarea t where t.idObra = :idObra and t.activo = true and (:excluirId is null or t.id <> :excluirId)")
    Double sumPorcentajeByObraExcluyendo(@Param("idObra") Long idObra, @Param("excluirId") Long excluirId);

}
