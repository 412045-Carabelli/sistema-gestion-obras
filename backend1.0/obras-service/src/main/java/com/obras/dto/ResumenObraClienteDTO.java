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
public class ResumenObraClienteDTO {
  private Long id_cliente;
  private String nombre_cliente;
  private Long id_obra;
  private String nombre_obra;
  private BigDecimal presupuestado;
  private BigDecimal cobros_realizados;
  private BigDecimal saldo;
}
