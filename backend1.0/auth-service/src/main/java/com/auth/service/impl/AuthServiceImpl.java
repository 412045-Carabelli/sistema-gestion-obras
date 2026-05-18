package com.auth.service.impl;

import com.auth.dto.*;
import com.auth.entity.AuditAuth;
import com.auth.entity.RefreshToken;
import com.auth.entity.Usuario;
import com.auth.exception.AccountLockedException;
import com.auth.exception.AuthException;
import com.auth.exception.UserAlreadyExistsException;
import com.auth.repository.AuditAuthRepository;
import com.auth.repository.RefreshTokenRepository;
import com.auth.repository.UsuarioRepository;
import com.auth.service.AuthService;
import com.auth.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthServiceImpl implements AuthService {
  private final UsuarioRepository usuarioRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final AuditAuthRepository auditAuthRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;

  private static final int MAX_LOGIN_ATTEMPTS = 5;
  private static final long LOCKOUT_DURATION_MINUTES = 15;

  @Override
  public AuthResponse registrar(RegisterRequest request) {
    // Validar que las contraseñas coincidan
    if (!request.getPassword().equals(request.getConfirmPassword())) {
      throw new AuthException("Las contraseñas no coinciden");
    }

    // Validar que no exista usuario con ese email o username
    if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
      throw new UserAlreadyExistsException("Email ya registrado");
    }
    if (usuarioRepository.findByUsername(request.getUsername()).isPresent()) {
      throw new UserAlreadyExistsException("Usuario ya existe");
    }

    // Crear usuario
    Usuario usuario = Usuario.builder()
        .email(request.getEmail())
        .username(request.getUsername())
        .passwordHash(passwordEncoder.encode(request.getPassword()))
        .rol("USER")
        .activo(Boolean.TRUE)
        .intentosFallidos(0)
        .build();

    usuario = usuarioRepository.save(usuario);
    log.info("Usuario registrado: {} ({})", usuario.getUsername(), usuario.getEmail());

    // Auditoría
    registrarAudit(usuario.getId(), usuario.getEmail(), "REGISTER", "N/A", null, null);

    // Generar tokens
    return generarTokens(usuario);
  }

  @Override
  public AuthResponse login(LoginRequest request, String ip, String userAgent) {
    Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new AuthException("Email o contraseña inválidos"));

    // Verificar si cuenta está activa
    if (!usuario.getActivo()) {
      registrarAudit(usuario.getId(), usuario.getEmail(), "LOGIN_FAIL", ip, userAgent, "Cuenta inactiva");
      throw new AuthException("Cuenta inactiva");
    }

    // Verificar si está bloqueado
    if (usuario.estaBloqueado()) {
      registrarAudit(usuario.getId(), usuario.getEmail(), "LOGIN_FAIL", ip, userAgent, "Cuenta bloqueada");
      throw new AccountLockedException("Cuenta bloqueada. Intente más tarde.");
    }

    // Verificar contraseña
    if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
      // Incrementar intentos fallidos
      usuario.setIntentosFallidos(usuario.getIntentosFallidos() + 1);
      if (usuario.getIntentosFallidos() >= MAX_LOGIN_ATTEMPTS) {
        usuario.setBloqueadoHasta(Instant.now().plusSeconds(LOCKOUT_DURATION_MINUTES * 60));
        log.warn("Cuenta bloqueada por intentos fallidos: {}", usuario.getEmail());
      }
      usuarioRepository.save(usuario);
      registrarAudit(usuario.getId(), usuario.getEmail(), "LOGIN_FAIL", ip, userAgent,
          "Contraseña inválida (intento " + usuario.getIntentosFallidos() + ")");
      throw new AuthException("Email o contraseña inválidos");
    }

    // Limpiar intentos fallidos en login exitoso
    usuario.setIntentosFallidos(0);
    usuario.setUltimaActualizacion(Instant.now());
    usuarioRepository.save(usuario);

    registrarAudit(usuario.getId(), usuario.getEmail(), "LOGIN_OK", ip, userAgent, null);
    log.info("Login exitoso: {}", usuario.getEmail());

    return generarTokens(usuario);
  }

  @Override
  public AuthResponse cambiarContrasena(Long usuarioId, ChangePasswordRequest request) {
    Usuario usuario = usuarioRepository.findById(usuarioId)
        .orElseThrow(() -> new AuthException("Usuario no encontrado"));

    // Validar contraseña actual
    if (!passwordEncoder.matches(request.getCurrentPassword(), usuario.getPasswordHash())) {
      registrarAudit(usuario.getId(), usuario.getEmail(), "CHANGE_PASSWORD", "N/A", null, "Contraseña actual inválida");
      throw new AuthException("Contraseña actual inválida");
    }

    // Validar que las nuevas contraseñas coincidan
    if (!request.getNewPassword().equals(request.getConfirmPassword())) {
      throw new AuthException("Las nuevas contraseñas no coinciden");
    }

    // Actualizar contraseña
    usuario.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    usuario.setUltimaActualizacion(Instant.now());
    usuarioRepository.save(usuario);

    registrarAudit(usuario.getId(), usuario.getEmail(), "CHANGE_PASSWORD", "N/A", null, "Exitoso");
    log.info("Contraseña cambiada: {}", usuario.getEmail());

    return generarTokens(usuario);
  }

  @Override
  public AuthResponse refresh(RefreshTokenRequest request, String ip) {
    RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
        .orElseThrow(() -> new AuthException("Refresh token inválido"));

    // Validar que no esté revocado ni expirado
    if (!refreshToken.esValido()) {
      throw new AuthException("Refresh token expirado o revocado");
    }

    Usuario usuario = refreshToken.getUsuario();

    // Validar que usuario siga activo
    if (!usuario.getActivo()) {
      throw new AuthException("Usuario inactivo");
    }

    registrarAudit(usuario.getId(), usuario.getEmail(), "REFRESH", ip, null, null);

    return generarTokens(usuario);
  }

  @Override
  public void logout(Long usuarioId, String refreshToken) {
    refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
      token.setRevocado(Boolean.TRUE);
      refreshTokenRepository.save(token);
    });

    Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
    if (usuario != null) {
      registrarAudit(usuario.getId(), usuario.getEmail(), "LOGOUT", "N/A", null, null);
    }
  }

  // Helpers
  private AuthResponse generarTokens(Usuario usuario) {
    // Generar access token
    String accessToken = jwtUtil.generateAccessToken(usuario);

    // Generar refresh token (UUID aleatorio)
    String refreshTokenString = UUID.randomUUID().toString();
    RefreshToken refreshToken = RefreshToken.builder()
        .usuario(usuario)
        .token(refreshTokenString)
        .expiraEn(Instant.now().plusSeconds(604800))  // 7 días
        .revocado(Boolean.FALSE)
        .ipOrigen("N/A")
        .build();
    refreshTokenRepository.save(refreshToken);

    return AuthResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshTokenString)
        .tokenType("Bearer")
        .expiresIn(900L)  // 15 minutos
        .userId(usuario.getId())
        .email(usuario.getEmail())
        .username(usuario.getUsername())
        .rol(usuario.getRol())
        .organizacionId(null)
        .build();
  }

  private void registrarAudit(Long usuarioId, String email, String accion, String ip, String userAgent, String detalle) {
    AuditAuth audit = AuditAuth.builder()
        .usuarioId(usuarioId)
        .email(email)
        .accion(accion)
        .ip(ip != null ? ip : "N/A")
        .userAgent(userAgent)
        .detalle(detalle)
        .build();
    auditAuthRepository.save(audit);
  }
}
