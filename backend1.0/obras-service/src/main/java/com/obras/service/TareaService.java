package com.obras.service;

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
}
