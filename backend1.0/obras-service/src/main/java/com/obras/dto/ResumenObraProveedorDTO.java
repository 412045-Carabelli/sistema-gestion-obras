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
public class ResumenObraProveedorDTO {
  private Long id_proveedor;
  private String nombre_proveedor;
  private Long id_obra;
  private String nombre_obra;
  private BigDecimal costos;
  private BigDecimal pagos_realizados;
  private BigDecimal saldo;
}
