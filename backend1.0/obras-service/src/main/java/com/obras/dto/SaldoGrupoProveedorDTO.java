package com.obras.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SaldoGrupoProveedorDTO {
  private Long id_grupo;
  private String nombre_grupo;
  private Long id_proveedor;
  private String nombre_proveedor;
  private BigDecimal total_costos;
  private BigDecimal total_pagos;
  private BigDecimal saldo_pendiente;
}
