package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class ObraExternalDto {
    private Long id;
    @JsonProperty("id_cliente")
    private Long idCliente;
    @JsonProperty("obra_estado")
    private String obraEstado;
    private String nombre;
    private String direccion;
    @JsonProperty("fecha_inicio")
    private LocalDateTime fechaInicio;
    @JsonProperty("fecha_fin")
    private LocalDateTime fechaFin;
    @JsonProperty("fecha_adjudicada")
    private LocalDateTime fechaAdjudicada;
    @JsonProperty("fecha_perdida")
    private LocalDateTime fechaPerdida;
    private BigDecimal presupuesto;
    @JsonProperty("beneficio_global")
    private Boolean beneficioGlobal;
    @JsonProperty("tiene_comision")
    private Boolean tieneComision;
    private BigDecimal beneficio;
    private BigDecimal comision;
    private Boolean activo;
    @JsonProperty("creado_en")
    private Instant creadoEn;
    private String notas;
    @JsonProperty("ultima_actualizacion")
    private Instant ultimaActualizacion;
    @JsonProperty("tipo_actualizacion")
    private String tipoActualizacion;
    private List<ObraCostoExternalDto> costos = new ArrayList<>();
    private List<TareaExternalDto> tareas = new ArrayList<>();
}
