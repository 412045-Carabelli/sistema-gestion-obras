package com.auth.util;

import com.auth.config.JwtConfig;
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

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtUtil {
  private final JwtConfig jwtConfig;

  public String generateAccessToken(Usuario usuario, Long organizacionId) {
    long expirationMillis = System.currentTimeMillis() + (jwtConfig.getAccessTokenExpiration() * 1000);
    return Jwts.builder()
        .subject(usuario.getEmail())
        .claim("userId", usuario.getId())
        .claim("username", usuario.getUsername())
        .claim("rol", usuario.getRol())
        .claim("organizacionId", organizacionId)
        .issuedAt(new Date())
        .expiration(new Date(expirationMillis))
        .signWith(Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
        .compact();
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
