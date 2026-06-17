package com.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UsuarioInfoResponse {

  private Long id;

  private String username;

  private String email;

  private String nombre;

  private String apellido;

  private String rol;

  private Boolean activo;

  @JsonProperty("creado_en")
  private Instant creadoEn;
}
