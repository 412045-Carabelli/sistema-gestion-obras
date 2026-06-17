package com.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePerfilRequest {

  @NotBlank(message = "El nombre es requerido")
  private String nombre;

  @NotBlank(message = "El apellido es requerido")
  private String apellido;

  @NotBlank(message = "El email es requerido")
  @Email(message = "Email inválido")
  private String email;
}
