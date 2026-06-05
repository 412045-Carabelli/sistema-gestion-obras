package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TopObraFinancieroExternalDto {

    @JsonProperty("obra_id")
    private Long obraId;

    @JsonProperty("obra_nombre")
    private String obraNombre;

    private BigDecimal presupuesto;

    @JsonProperty("total_cobros")
    private BigDecimal totalCobros;

    @JsonProperty("total_pagos")
    private BigDecimal totalPagos;
}
