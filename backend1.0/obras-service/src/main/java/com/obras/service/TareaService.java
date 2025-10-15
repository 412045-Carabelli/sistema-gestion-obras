package com.obras.service;

import com.obras.dto.ObraCostoDTO;
import com.obras.dto.ObraEstadoDTO;
import com.obras.dto.ProgresoDTO;
import com.obras.dto.TareaDTO;
import com.obras.entity.ObraProveedor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TareaService {

    TareaDTO crear(TareaDTO dto);

    TareaDTO completarTarea(Long id);

    void borrar(Long id);

    @Transactional(readOnly = true)
    List<TareaDTO> tareasDeObra(Long idObra);

    List<TareaDTO> tareasDeProveedor(Long idProveedor);
}
