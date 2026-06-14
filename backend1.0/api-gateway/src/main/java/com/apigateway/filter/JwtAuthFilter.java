package com.apigateway.filter;

import com.apigateway.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter implements WebFilter {

  private final JwtProperties jwtProperties;

  // Rutas públicas que no requieren JWT
  private static final List<String> PUBLIC_PATHS = List.of(
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/bff/auth/login",
      "/bff/auth/register",
      "/bff/auth/refresh",
      "/api-docs",
      "/swagger-ui"
  );

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    // Permitir preflight CORS sin validar JWT
    if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
      return chain.filter(exchange);
    }

    String path = exchange.getRequest().getPath().value();

    // Permitir rutas públicas
    if (isPublicPath(path)) {
      return chain.filter(exchange);
    }

    // Leer Authorization header
    String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      log.warn("Request sin token JWT: {}", path);
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    }

    String token = authHeader.substring(7);

    try {
      Claims claims = Jwts.parser()
          .verifyWith(Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8)))
          .build()
          .parseSignedClaims(token)
          .getPayload();

      // Extraer claims
      Long userId = ((Number) claims.get("userId")).longValue();
      String username = (String) claims.get("username");
      String rol = (String) claims.get("rol");
      Object orgIdObj = claims.get("organizacionId");
      String empresaId = orgIdObj != null ? String.valueOf(((Number) orgIdObj).longValue()) : null;

      // Inyectar headers hacia downstream usando decorator (headers son read-only en WebFlux 6.1+)
      final String finalUserId = String.valueOf(userId);
      final String finalUsername = username != null ? username : "";
      final String finalRol = rol != null ? rol : "USER";
      final String finalEmpresaId = empresaId != null ? empresaId : "";

      ServerHttpRequest decoratedRequest = new ServerHttpRequestDecorator(exchange.getRequest()) {
        @Override
        public HttpHeaders getHeaders() {
          HttpHeaders headers = new HttpHeaders();
          headers.putAll(super.getHeaders());
          headers.set("X-User-Id", finalUserId);
          headers.set("X-Username", finalUsername);
          headers.set("X-User-Rol", finalRol);
          headers.set("X-Empresa-Id", finalEmpresaId);
          return headers;
        }
      };

      return chain.filter(exchange.mutate().request(decoratedRequest).build());

    } catch (JwtException e) {
      log.warn("Token JWT inválido o expirado: {}", e.getMessage());
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    } catch (Exception e) {
      log.error("Error inesperado validando JWT", e);
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    }
  }

  private boolean isPublicPath(String path) {
    return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
  }
}
