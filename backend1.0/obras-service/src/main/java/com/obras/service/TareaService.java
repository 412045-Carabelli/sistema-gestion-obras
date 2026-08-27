package com.obras.service;

import com.obras.dto.TareaCronogramaResponse;
import com.obras.dto.TareaDTO;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TareaService {

    TareaDTO crear(TareaDTO dto);

    TareaDTO actualizar(Long id, TareaDTO dto);

    TareaDTO completarTarea(Long id);

    void borrar(Long id);

    @Transactional(readOnly = true)
    List<TareaDTO> tareasDeObra(Long idObra);

    List<TareaDTO> tareasDeProveedor(Long idProveedor);

    /** Todas las tareas activas de obras ADJUDICADA/EN_PROGRESO/FINALIZADA de la organización,
     * enriquecidas con nombre de obra/proveedor/gremio — para el módulo general Diagrama de Gantt. */
    @Transactional(readOnly = true)
    List<TareaCronogramaResponse> tareasActivasDeOrganizacion(Long organizacionId);
}
