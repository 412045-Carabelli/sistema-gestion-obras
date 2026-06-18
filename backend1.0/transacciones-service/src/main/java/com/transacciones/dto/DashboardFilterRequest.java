package com.transacciones.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

/**
 * DTO de filtro para el endpoint de cuenta corriente del dashboard.
 * Todos los parámetros son opcionales (NULL = sin filtro).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardFilterRequest {

  /**
   * Filtro por obra específica (opcional)
   */
  private Long obraId;

  /**
   * Filtro por cliente específico (opcional)
   */
  private Long clienteId;

  /**
   * Filtro por proveedor específico (opcional)
   */
  private Long proveedorId;

  /**
   * Fecha inicio del rango (opcional)
   */
  private LocalDate fechaInicio;

  /**
   * Fecha fin del rango (opcional)
   */
  private LocalDate fechaFin;

  /**
   * Filtro por organización (obligatorio en contexto multiempresa)
   */
  private Long organizacionId;
}
