package com.obras.service;

import com.obras.dto.*;
import com.obras.entity.ObraProveedor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.*;

public interface ObraService {
    ObraDTO crear(ObraDTO dto);
    Optional<ObraDTO> obtener(Long id);
    Page<ObraDTO> listar(Pageable p);
    ObraDTO actualizar(Long id, ObraDTO dto);
    void cambiarEstado(Long idObra, com.obras.enums.EstadoObraEnum estado);
    void activar(Long idObra);
}
