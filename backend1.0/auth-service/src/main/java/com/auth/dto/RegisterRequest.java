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
public class RegisterRequest {
  @Email(message = "Email debe ser válido")
  @NotBlank(message = "Email requerido")
  private String email;

  @NotBlank(message = "Usuario requerido")
  @Size(min = 3, max = 100, message = "Usuario debe tener entre 3 y 100 caracteres")
  private String username;

  @NotBlank(message = "Contraseña requerida")
  @Size(min = 8, max = 255, message = "Contraseña debe tener entre 8 y 255 caracteres")
  private String password;

  @NotBlank(message = "Confirmación de contraseña requerida")
  private String confirmPassword;
}
