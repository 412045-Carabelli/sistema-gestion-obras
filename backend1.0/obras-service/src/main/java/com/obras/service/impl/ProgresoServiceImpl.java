package com.obras.service.impl;

import com.obras.dto.ProgresoDTO;
import com.obras.repository.TareaRepository;
import com.obras.service.ProgresoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgresoServiceImpl implements ProgresoService {

    private final TareaRepository tareaRepo;

    @Override
    public ProgresoDTO calcularProgreso(Long idObra) {
        long total = tareaRepo.countByIdObraAndActivoTrue(idObra);
        if (total == 0) {
            return new ProgresoDTO(idObra, 0, 0, BigDecimal.ZERO);
        }

        long done  = tareaRepo.countByIdObraAndEstadoTarea_IdAndActivoTrue(idObra, 3L);
        BigDecimal porcentaje = new BigDecimal(done * 100.0 / total)
                .setScale(2, RoundingMode.HALF_UP);

        return new ProgresoDTO(idObra, total, done, porcentaje);
    }
}
