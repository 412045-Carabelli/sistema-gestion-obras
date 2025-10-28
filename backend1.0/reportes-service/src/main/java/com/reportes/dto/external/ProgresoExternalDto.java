package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProgresoExternalDto {
    @JsonProperty("id_obra")
    private Long idObra;
    @JsonProperty("total_tareas")
    private long totalTareas;
    @JsonProperty("tareas_completadas")
    private long tareasCompletadas;
    private BigDecimal porcentaje;
}
