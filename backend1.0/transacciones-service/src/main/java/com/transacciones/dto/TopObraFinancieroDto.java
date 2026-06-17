package com.transacciones.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TopObraFinancieroDto {

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
