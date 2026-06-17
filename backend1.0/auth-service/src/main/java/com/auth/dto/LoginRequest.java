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
public class LoginRequest {
  @Email(message = "Email debe ser válido")
  @NotBlank(message = "Email requerido")
  private String email;

  @NotBlank(message = "Contraseña requerida")
  private String password;
}
