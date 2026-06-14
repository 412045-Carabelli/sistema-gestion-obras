package com.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUsuarioRequest {

  @NotBlank(message = "El nombre es requerido")
  private String nombre;

  @NotBlank(message = "El apellido es requerido")
  private String apellido;

  @NotBlank(message = "El username es requerido")
  private String username;

  @NotBlank(message = "El email es requerido")
  @Email(message = "Email inválido")
  private String email;

  @NotBlank(message = "La contraseña es requerida")
  @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
  private String password;

  /** USER o ADMIN */
  private String rol = "USER";
}
