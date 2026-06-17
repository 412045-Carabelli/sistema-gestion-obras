package com.auth.service.impl;

import com.auth.dto.*;
import com.auth.entity.AuditAuth;
import com.auth.entity.Organizacion;
import com.auth.entity.RefreshToken;
import com.auth.entity.Usuario;
import com.auth.entity.UsuarioOrganizacion;
import com.auth.exception.AccountLockedException;
import com.auth.exception.AuthException;
import com.auth.exception.UserAlreadyExistsException;
import com.auth.repository.AuditAuthRepository;
import com.auth.repository.OrganizacionRepository;
import com.auth.repository.RefreshTokenRepository;
import com.auth.repository.UsuarioOrganizacionRepository;
import com.auth.repository.UsuarioRepository;
import com.auth.service.AuthService;
import com.auth.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthServiceImpl implements AuthService {
  private final UsuarioRepository usuarioRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final AuditAuthRepository auditAuthRepository;
  private final OrganizacionRepository organizacionRepository;
  private final UsuarioOrganizacionRepository usuarioOrganizacionRepository;
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

    // Crear organización y asignar usuario como ADMIN
    Organizacion org = Organizacion.builder()
        .nombre(request.getEmpresaNombre())
        .activo(Boolean.TRUE)
        .build();
    org = organizacionRepository.save(org);

    UsuarioOrganizacion usuarioOrg = UsuarioOrganizacion.builder()
        .usuarioId(usuario.getId())
        .organizacionId(org.getId())
        .rol("ADMIN")
        .activo(Boolean.TRUE)
        .build();
    usuarioOrganizacionRepository.save(usuarioOrg);
    log.info("Organización '{}' creada y asignada a usuario {}", org.getNombre(), usuario.getEmail());

    // Auditoría
    registrarAudit(usuario.getId(), usuario.getEmail(), "REGISTER", "N/A", null, null);

    // Generar tokens
    return generarTokens(usuario, org.getId());
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

    Long orgId = usuarioOrganizacionRepository.findFirstByUsuarioIdAndActivoTrue(usuario.getId())
        .map(UsuarioOrganizacion::getOrganizacionId)
        .orElse(null);
    return generarTokens(usuario, orgId);
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

    Long orgId = usuarioOrganizacionRepository.findFirstByUsuarioIdAndActivoTrue(usuario.getId())
        .map(UsuarioOrganizacion::getOrganizacionId)
        .orElse(null);
    return generarTokens(usuario, orgId);
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

    Long orgId = usuarioOrganizacionRepository.findFirstByUsuarioIdAndActivoTrue(usuario.getId())
        .map(UsuarioOrganizacion::getOrganizacionId)
        .orElse(null);
    return generarTokens(usuario, orgId);
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
  private AuthResponse generarTokens(Usuario usuario, Long organizacionId) {
    // Generar access token
    String accessToken = jwtUtil.generateAccessToken(usuario, organizacionId);

    // Generar refresh token (UUID aleatorio)
    String refreshTokenString = UUID.randomUUID().toString();
    RefreshToken refreshToken = RefreshToken.builder()
        .usuario(usuario)
        .token(refreshTokenString)
        .expiraEn(Instant.now().plusSeconds(2592000))  // 30 días
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
        .nombre(usuario.getNombre())
        .apellido(usuario.getApellido())
        .organizacionId(organizacionId)
        .build();
  }

  @Override
  public AuthResponse actualizarPerfil(Long usuarioId, UpdatePerfilRequest request) {
    Usuario usuario = usuarioRepository.findById(usuarioId)
        .orElseThrow(() -> new AuthException("Usuario no encontrado"));

    // Validar email único si cambia
    if (!usuario.getEmail().equalsIgnoreCase(request.getEmail())) {
      usuarioRepository.findByEmail(request.getEmail()).ifPresent(u -> {
        throw new UserAlreadyExistsException("El email ya está en uso");
      });
    }

    usuario.setNombre(request.getNombre());
    usuario.setApellido(request.getApellido());
    usuario.setEmail(request.getEmail());
    usuario.setUltimaActualizacion(Instant.now());
    usuarioRepository.save(usuario);

    registrarAudit(usuario.getId(), usuario.getEmail(), "UPDATE_PERFIL", "N/A", null, "Exitoso");
    log.info("Perfil actualizado: {}", usuario.getEmail());

    Long orgId = usuarioOrganizacionRepository.findFirstByUsuarioIdAndActivoTrue(usuario.getId())
        .map(UsuarioOrganizacion::getOrganizacionId)
        .orElse(null);
    return generarTokens(usuario, orgId);
  }

  @Override
  @Transactional(readOnly = true)
  public List<UsuarioInfoResponse> listarUsuariosOrganizacion(Long organizacionId) {
    return usuarioOrganizacionRepository.findByOrganizacionIdAndActivoTrue(organizacionId)
        .stream()
        .map(uo -> usuarioRepository.findById(uo.getUsuarioId()).orElse(null))
        .filter(u -> u != null)
        .map(u -> UsuarioInfoResponse.builder()
            .id(u.getId())
            .username(u.getUsername())
            .email(u.getEmail())
            .nombre(u.getNombre())
            .apellido(u.getApellido())
            .rol(u.getRol())
            .activo(u.getActivo())
            .creadoEn(u.getCreadoEn())
            .build())
        .toList();
  }

  @Override
  public UsuarioInfoResponse crearUsuarioEnOrganizacion(Long organizacionId, CreateUsuarioRequest request) {
    if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
      throw new UserAlreadyExistsException("Email ya registrado");
    }
    if (usuarioRepository.findByUsername(request.getUsername()).isPresent()) {
      throw new UserAlreadyExistsException("Username ya existe");
    }

    String rol = (request.getRol() != null && !request.getRol().isBlank()) ? request.getRol() : "USER";

    Usuario usuario = Usuario.builder()
        .email(request.getEmail())
        .username(request.getUsername())
        .nombre(request.getNombre())
        .apellido(request.getApellido())
        .passwordHash(passwordEncoder.encode(request.getPassword()))
        .rol(rol)
        .activo(Boolean.TRUE)
        .intentosFallidos(0)
        .build();

    usuario = usuarioRepository.save(usuario);

    UsuarioOrganizacion usuarioOrg = UsuarioOrganizacion.builder()
        .usuarioId(usuario.getId())
        .organizacionId(organizacionId)
        .rol(rol)
        .activo(Boolean.TRUE)
        .build();
    usuarioOrganizacionRepository.save(usuarioOrg);

    registrarAudit(usuario.getId(), usuario.getEmail(), "CREATE_USER", "N/A", null, "Org " + organizacionId);
    log.info("Usuario {} creado en org {}", usuario.getEmail(), organizacionId);

    return UsuarioInfoResponse.builder()
        .id(usuario.getId())
        .username(usuario.getUsername())
        .email(usuario.getEmail())
        .nombre(usuario.getNombre())
        .apellido(usuario.getApellido())
        .rol(usuario.getRol())
        .activo(usuario.getActivo())
        .creadoEn(usuario.getCreadoEn())
        .build();
  }

  @Override
  public UsuarioInfoResponse actualizarUsuario(Long organizacionId, Long usuarioId, UpdateUsuarioRequest request) {
    // Verificar que el usuario pertenece a la org
    usuarioOrganizacionRepository
        .findByOrganizacionIdAndActivoTrue(organizacionId)
        .stream()
        .filter(uo -> uo.getUsuarioId().equals(usuarioId))
        .findFirst()
        .orElseThrow(() -> new AuthException("Usuario no pertenece a la organización"));

    Usuario usuario = usuarioRepository.findById(usuarioId)
        .orElseThrow(() -> new AuthException("Usuario no encontrado"));

    if (!usuario.getEmail().equalsIgnoreCase(request.getEmail())) {
      usuarioRepository.findByEmail(request.getEmail()).ifPresent(u -> {
        throw new UserAlreadyExistsException("El email ya está en uso");
      });
    }

    usuario.setNombre(request.getNombre());
    usuario.setApellido(request.getApellido());
    usuario.setEmail(request.getEmail());
    if (request.getRol() != null && !request.getRol().isBlank()) {
      usuario.setRol(request.getRol());
    }
    usuarioRepository.save(usuario);

    registrarAudit(usuario.getId(), usuario.getEmail(), "UPDATE_USUARIO", "N/A", null, "Org " + organizacionId);
    log.info("Usuario {} actualizado por admin de org {}", usuarioId, organizacionId);

    return UsuarioInfoResponse.builder()
        .id(usuario.getId())
        .username(usuario.getUsername())
        .email(usuario.getEmail())
        .nombre(usuario.getNombre())
        .apellido(usuario.getApellido())
        .rol(usuario.getRol())
        .activo(usuario.getActivo())
        .creadoEn(usuario.getCreadoEn())
        .build();
  }

  @Override
  public UsuarioInfoResponse cambiarEstadoUsuario(Long organizacionId, Long usuarioId, boolean activo) {
    usuarioOrganizacionRepository
        .findByOrganizacionIdAndActivoTrue(organizacionId)
        .stream()
        .filter(uo -> uo.getUsuarioId().equals(usuarioId))
        .findFirst()
        .orElseThrow(() -> new AuthException("Usuario no pertenece a la organización"));

    Usuario usuario = usuarioRepository.findById(usuarioId)
        .orElseThrow(() -> new AuthException("Usuario no encontrado"));

    usuario.setActivo(activo);
    usuarioRepository.save(usuario);

    String accionLog = activo ? "REACTIVAR_USUARIO" : "BAJA_USUARIO";
    registrarAudit(usuario.getId(), usuario.getEmail(), accionLog, "N/A", null, "Org " + organizacionId);
    log.info("Usuario {} estado={} por admin de org {}", usuarioId, activo, organizacionId);

    return UsuarioInfoResponse.builder()
        .id(usuario.getId())
        .username(usuario.getUsername())
        .email(usuario.getEmail())
        .nombre(usuario.getNombre())
        .apellido(usuario.getApellido())
        .rol(usuario.getRol())
        .activo(usuario.getActivo())
        .creadoEn(usuario.getCreadoEn())
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
