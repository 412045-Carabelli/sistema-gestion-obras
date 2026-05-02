package com.obras.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SaldoProveedorDTO {
    private Long id;
    private String nombre;
    private Double total_costos;
    private Double total_pagos;
    private Double saldo_pendiente;
}
