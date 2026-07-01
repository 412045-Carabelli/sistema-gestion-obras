package com.auth.util;

import com.auth.config.JwtConfig;
import com.auth.entity.Plan;
import com.auth.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtUtil {
  private final JwtConfig jwtConfig;

  public String generateAccessToken(Usuario usuario, Long organizacionId) {
    return generateAccessToken(usuario, organizacionId, null);
  }

  public String generateAccessToken(Usuario usuario, Long organizacionId, Plan plan) {
    long expirationMillis = System.currentTimeMillis() + (jwtConfig.getAccessTokenExpiration() * 1000);
    var builder = Jwts.builder()
        .subject(usuario.getEmail())
        .claim("userId", usuario.getId())
        .claim("username", usuario.getUsername())
        .claim("rol", usuario.getRol())
        .claim("organizacionId", organizacionId);

    if (plan != null) {
      builder.claim("planCodigo", plan.getCodigo());
      builder.claim("planLimites", buildLimitesMap(plan));
      builder.claim("planFeatures", buildFeaturesMap(plan));
    }

    return builder
        .issuedAt(new Date())
        .expiration(new Date(expirationMillis))
        .signWith(Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
        .compact();
  }

  private Map<String, Object> buildLimitesMap(Plan plan) {
    Map<String, Object> limites = new HashMap<>();
    limites.put("maxUsuarios", plan.getMaxUsuarios());
    limites.put("maxObrasActivas", plan.getMaxObrasActivas());
    limites.put("maxClientes", plan.getMaxClientes());
    limites.put("maxProveedores", plan.getMaxProveedores());
    limites.put("maxTransaccionesMes", plan.getMaxTransaccionesMes());
    limites.put("maxStorageMb", plan.getMaxStorageMb());
    limites.put("diasHistorialReportes", plan.getDiasHistorialReportes());
    return limites;
  }

  private Map<String, Object> buildFeaturesMap(Plan plan) {
    Map<String, Object> features = new HashMap<>();
    features.put("facturas", plan.getTieneFacturas());
    features.put("agenda", plan.getTieneAgenda());
    features.put("grupos_obras", plan.getTieneGruposObras());
    features.put("exportar", plan.getTieneExportar());
    features.put("push_notifications", plan.getTienePushNotifications());
    features.put("soporte_prioritario", plan.getTieneSoportePrioritario());
    features.put("api_access", plan.getTieneApiAccess());
    return features;
  }

  public Claims validateAccessToken(String token) throws JwtException {
    return Jwts.parser()
        .verifyWith(Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8)))
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  public Long getUserIdFromToken(String token) {
    try {
      Claims claims = validateAccessToken(token);
      Number userId = (Number) claims.get("userId");
      return userId != null ? userId.longValue() : null;
    } catch (JwtException e) {
      log.error("Error extrayendo userId del token", e);
      return null;
    }
  }

  public String getUsernameFromToken(String token) {
    try {
      Claims claims = validateAccessToken(token);
      return claims.getSubject();
    } catch (JwtException e) {
      log.error("Error extrayendo username del token", e);
      return null;
    }
  }

  public String getRolFromToken(String token) {
    try {
      Claims claims = validateAccessToken(token);
      return (String) claims.get("rol");
    } catch (JwtException e) {
      log.error("Error extrayendo rol del token", e);
      return null;
    }
  }

  public boolean isTokenExpired(String token) {
    try {
      Claims claims = validateAccessToken(token);
      return claims.getExpiration().before(new Date());
    } catch (JwtException e) {
      return true;
    }
  }
}
