package com.obras.repository;

import com.obras.entity.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.zip.ZipFile;

@Repository
public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findByIdObraAndActivoTrue(Long idObra);

    Optional<Tarea> findByIdAndActivoTrue(Long id);

    long countByIdObraAndActivoTrue(Long idObra);

    long countByIdObraAndEstadoTarea_IdAndActivoTrue(Long idObra, Long idEstadoTarea);

    List<Tarea> findByIdProveedorAndActivoTrue(Long idProveedor);
}