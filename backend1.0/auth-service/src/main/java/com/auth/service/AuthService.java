package com.auth.service;

import com.auth.dto.*;

import java.util.List;

public interface AuthService {
  AuthResponse registrar(RegisterRequest request);

  AuthResponse login(LoginRequest request, String ip, String userAgent);

  AuthResponse cambiarContrasena(Long usuarioId, ChangePasswordRequest request);

  AuthResponse refresh(RefreshTokenRequest request, String ip);

  void logout(Long usuarioId, String refreshToken);

  AuthResponse actualizarPerfil(Long usuarioId, UpdatePerfilRequest request);

  List<UsuarioInfoResponse> listarUsuariosOrganizacion(Long organizacionId);

  UsuarioInfoResponse crearUsuarioEnOrganizacion(Long organizacionId, CreateUsuarioRequest request);

  UsuarioInfoResponse actualizarUsuario(Long organizacionId, Long usuarioId, UpdateUsuarioRequest request);

  UsuarioInfoResponse cambiarEstadoUsuario(Long organizacionId, Long usuarioId, boolean activo);
}
