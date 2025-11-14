package com.obras.service;

import com.obras.dto.ObraCostoDTO;
import com.obras.enums.EstadoPagoEnum;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ObraCostoService {

    ObraCostoDTO crear(ObraCostoDTO dto);

    ObraCostoDTO actualizarEstadoPago(Long idCosto, EstadoPagoEnum estadoPago);

    void eliminar(Long id);

    @Transactional(readOnly = true)
    List<ObraCostoDTO> listarPorObra(Long idObra);
}

