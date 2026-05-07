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
public class SaldoGrupoClienteDTO {
  private Long id_grupo;
  private String nombre_grupo;
  private Long id_cliente;
  private String nombre_cliente;
  private BigDecimal total_presupuesto;
  private BigDecimal total_cobros;
  private BigDecimal saldo_pendiente;
}
