package com.obras.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrupoObraDTO {
  private Long id;

  @NotNull(message = "Cliente requerido")
  private Long id_cliente;

  @NotBlank(message = "Nombre requerido")
  @Size(min = 3, max = 255, message = "Nombre debe tener entre 3 y 255 caracteres")
  private String nombre;

  private Boolean activo;
  private Instant creado_en;
  private Instant ultima_actualizacion;
  private String tipo_actualizacion;
}
