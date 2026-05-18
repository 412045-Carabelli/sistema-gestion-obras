package com.auth.service;

import com.auth.dto.*;

public interface AuthService {
  AuthResponse registrar(RegisterRequest request);

  AuthResponse login(LoginRequest request, String ip, String userAgent);

  AuthResponse cambiarContrasena(Long usuarioId, ChangePasswordRequest request);

  AuthResponse refresh(RefreshTokenRequest request, String ip);

  void logout(Long usuarioId, String refreshToken);
}
