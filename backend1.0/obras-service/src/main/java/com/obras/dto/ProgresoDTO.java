package com.obras.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProgresoDTO {
    private Long id_obra;
    private long total_tareas;
    private long tareas_completadas;
    private BigDecimal porcentaje;
}

