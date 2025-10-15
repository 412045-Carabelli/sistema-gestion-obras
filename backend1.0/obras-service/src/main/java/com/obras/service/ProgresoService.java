package com.obras.service;

import com.obras.dto.ProgresoDTO;
import org.springframework.stereotype.Service;

public interface ProgresoService {
    ProgresoDTO calcularProgreso(Long idObra);
}
