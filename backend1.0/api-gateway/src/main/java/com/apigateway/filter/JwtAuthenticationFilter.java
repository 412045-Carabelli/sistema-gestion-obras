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

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    String path = exchange.getRequest().getURI().getPath();

    // Skip validation para rutas públicas
    if (isPublicRoute(path)) {
      return chain.filter(exchange);
    }

    // Extraer token del header Authorization
    String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      log.warn("Ruta protegida accedida sin token: {}", path);
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    }

    String token = authHeader.substring("Bearer ".length());

    try {
      // Validar y parsear JWT
      Claims claims = validateAndParseToken(token);

      // Extraer claims
      Long userId = ((Number) claims.get("userId")).longValue();
      String username = claims.getSubject();  // email del subject
      String rol = (String) claims.get("rol");

      // Propagar como headers hacia downstream
      ServerWebExchange mutatedExchange = exchange.mutate()
          .request(r -> r
              .header("X-User-Id", userId.toString())
              .header("X-User-Name", username)
              .header("X-User-Rol", rol != null ? rol : "USER")
          )
          .build();

      log.debug("JWT validado para usuario: {} ({})", username, userId);
      return chain.filter(mutatedExchange);

    } catch (JwtException e) {
      log.warn("Token inválido o expirado: {}", e.getMessage());
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    }
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
        || path.equals("/");
  }
}
