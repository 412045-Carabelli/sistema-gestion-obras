package com.auth.controller;

import com.auth.dto.*;
import com.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService authService;

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegisterRequest request) {
    AuthResponse response = authService.registrar(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest servletRequest) {
    String ip = obtenerIpCliente(servletRequest);
    String userAgent = servletRequest.getHeader("User-Agent");
    AuthResponse response = authService.login(request, ip, userAgent);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/change-password")
  public ResponseEntity<AuthResponse> cambiarContrasena(
      @Valid @RequestBody ChangePasswordRequest request,
      Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // Extraer userId del principal (será pasado por el gateway via X-User-Id header)
    Long usuarioId = extraerUsuarioId(authentication);
    if (usuarioId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    AuthResponse response = authService.cambiarContrasena(usuarioId, request);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthResponse> refresh(
      @Valid @RequestBody RefreshTokenRequest request,
      HttpServletRequest servletRequest) {
    String ip = obtenerIpCliente(servletRequest);
    AuthResponse response = authService.refresh(request, ip);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      @Valid @RequestBody RefreshTokenRequest request,
      Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    Long usuarioId = extraerUsuarioId(authentication);
    if (usuarioId != null) {
      authService.logout(usuarioId, request.getRefreshToken());
    }

    return ResponseEntity.noContent().build();
  }

  // Helpers
  private String obtenerIpCliente(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
    }
    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
      return xRealIp;
    }
    return request.getRemoteAddr();
  }

  private Long extraerUsuarioId(Authentication authentication) {
    // El gateway inyectará X-User-Id header, pero en Spring Security
    // es mejor obtenerlo del principal. Para now, retornamos null
    // esto será manejado completamente en el gateway
    return null;
  }
}
