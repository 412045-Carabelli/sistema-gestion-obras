package com.obras.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrupoObraDTO {
  private Long id;
  private Long id_cliente;
  private String nombre;
  private Boolean activo;
  private Instant creado_en;
  private Instant ultima_actualizacion;
  private String tipo_actualizacion;
}
