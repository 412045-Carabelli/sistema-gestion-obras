package com.auth.dto;

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
public class ChangePasswordRequest {
  @NotBlank(message = "Contraseña actual requerida")
  private String currentPassword;

  @NotBlank(message = "Nueva contraseña requerida")
  @Size(min = 8, max = 255, message = "Contraseña debe tener entre 8 y 255 caracteres")
  private String newPassword;

  @NotBlank(message = "Confirmación de contraseña requerida")
  private String confirmPassword;
}
