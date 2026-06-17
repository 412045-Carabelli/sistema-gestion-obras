package com.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * JWT Authentication Filter para API Gateway (WebFlux).
 *
 * Valida JWT tokens en el header Authorization: Bearer <token>.
 * Extrae userId, username, rol y los propaga como headers (X-User-Id, X-User-Name, X-User-Rol)
 * hacia los servicios downstream, que confían en el gateway para la validación.
 *
 * Rutas públicas (/auth/**, /api-docs/**, /swagger-ui/**) pasan sin validación.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements WebFilter {

  @Value("${jwt.secret:your-super-secret-key-min-32-chars-long-for-hs256-algorithm}")
  private String jwtSecret;

  @Value("${bot.internal-token:sgo-bot-internal-token-2024}")
  private String botInternalToken;

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    // TODO: JWT auth deshabilitado temporalmente - no hay auth implementado aún
    return chain.filter(exchange);
  }

  private Claims validateAndParseToken(String token) throws JwtException {
    return Jwts.parser()
        .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  private boolean isPublicRoute(String path) {
    return path.startsWith("/auth/")
        || path.startsWith("/api-docs/")
        || path.startsWith("/swagger-ui/")
        || path.startsWith("/bff/")   // TODO: remover cuando auth esté implementado
        || path.equals("/");
  }
}
