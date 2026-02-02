package com.obras.service.impl;

import com.obras.dto.ProgresoDTO;
import com.obras.enums.EstadoTareaEnum;
import com.obras.repository.TareaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgresoServiceImplTest {

    @Mock
    private TareaRepository tareaRepo;

    @InjectMocks
    private ProgresoServiceImpl service;

    @Test
    void calcular_progreso_sin_tareas() {
        when(tareaRepo.countByIdObraAndActivoTrue(10L)).thenReturn(0L);

        ProgresoDTO dto = service.calcularProgreso(10L);

        assertEquals(0L, dto.getTotal_tareas());
        assertEquals(0L, dto.getTareas_completadas());
        assertEquals(new BigDecimal("0"), dto.getPorcentaje());
    }

    @Test
    void calcular_progreso_con_tareas() {
        when(tareaRepo.countByIdObraAndActivoTrue(20L)).thenReturn(3L);
        when(tareaRepo.countByIdObraAndEstadoTareaAndActivoTrue(20L, EstadoTareaEnum.COMPLETADA)).thenReturn(2L);

        ProgresoDTO dto = service.calcularProgreso(20L);

        assertEquals(3L, dto.getTotal_tareas());
        assertEquals(2L, dto.getTareas_completadas());
        assertEquals(new BigDecimal("66.67"), dto.getPorcentaje());
    }
}
