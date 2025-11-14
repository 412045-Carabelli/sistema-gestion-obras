package com.obras.repository;

import com.obras.entity.Tarea;
import com.obras.enums.EstadoTareaEnum;
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

    List<Tarea> findByIdProveedorAndActivoTrue(Long idProveedor);

    long countByIdObraAndEstadoTareaAndActivoTrue(Long idObra, EstadoTareaEnum estado);

}