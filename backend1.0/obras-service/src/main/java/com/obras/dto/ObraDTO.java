package com.obras.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ObraDTO {
    private Long id;
    private Long id_cliente;
    private ObraEstadoDTO obra_estado;
    private String nombre;
    private String direccion;
    private LocalDateTime fecha_inicio;
    private LocalDateTime fecha_fin;
    private LocalDateTime fecha_adjudicada;
    private LocalDateTime fecha_perdida;
    private BigDecimal presupuesto;
    private BigDecimal gastado;
    private Boolean beneficio_global;
    private Boolean tiene_comision;
    private BigDecimal beneficio;
    private BigDecimal comision;
    private List<TareaDTO> tareas;
    private List<ObraCostoDTO> costos;
}


