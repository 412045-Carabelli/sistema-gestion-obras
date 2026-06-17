package com.obras.service;

import com.obras.dto.*;
import com.obras.entity.ObraProveedor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.*;

public interface ObraService {
    ObraDTO crear(ObraDTO dto, Long empresaId);
    Optional<ObraDTO> obtener(Long id);
    Page<ObraDTO> listar(Pageable p, Long empresaId);
    Page<ObraListDTO> listarResumen(Pageable p, com.obras.enums.EstadoObraEnum estado, Boolean activo, String q, Long empresaId);
    Page<ObraDTO> listarPorCliente(Long idCliente, Pageable p, Long empresaId);
    ObraDTO actualizar(Long id, ObraDTO dto);
    Optional<ObraDTO> obtenerUltimaCondicion();
    void cambiarEstado(Long idObra, com.obras.enums.EstadoObraEnum estado);
    void activar(Long idObra);
}
