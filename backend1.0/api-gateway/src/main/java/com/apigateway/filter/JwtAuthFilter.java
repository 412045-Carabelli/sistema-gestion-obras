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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter implements WebFilter {

  private final JwtProperties jwtProperties;
  private final ObjectMapper objectMapper = new ObjectMapper();

  // Rutas públicas que no requieren JWT
  private static final List<String> PUBLIC_PATHS = List.of(
      "/auth/login",
      // "/auth/register",   // REGISTRO DESHABILITADO
      "/auth/refresh",
      "/auth/planes",        // Pricing page — sin JWT
      "/bff/auth/login",
      // "/bff/auth/register",  // REGISTRO DESHABILITADO
      "/bff/auth/refresh",
      "/bff/mp/webhook",     // MP webhook — firma validada por auth-service
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

    // Leer token: primero Authorization header, luego query param ?token=
    String token = null;
    String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = exchange.getRequest().getQueryParams().getFirst("token");
    }

    if (token == null || token.isBlank()) {
      log.warn("Request sin token JWT: {}", path);
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      return exchange.getResponse().setComplete();
    }

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
      String organizacionId = orgIdObj != null ? String.valueOf(((Number) orgIdObj).longValue()) : null;

      // Claims de plan
      String planCodigo = (String) claims.get("planCodigo");
      String planLimitesJson = toJson(claims.get("planLimites"));
      String planFeaturesJson = toJson(claims.get("planFeatures"));

      // Inyectar headers hacia downstream usando decorator (headers son read-only en WebFlux 6.1+)
      final String finalUserId = String.valueOf(userId);
      final String finalUsername = username != null ? username : "";
      final String finalRol = rol != null ? rol : "USER";
      final String finalEmpresaId = organizacionId != null ? organizacionId : "";
      final String finalPlanCodigo = planCodigo != null ? planCodigo : "FREE";
      final String finalPlanLimites = planLimitesJson;
      final String finalPlanFeatures = planFeaturesJson;

      ServerHttpRequest decoratedRequest = new ServerHttpRequestDecorator(exchange.getRequest()) {
        @Override
        public HttpHeaders getHeaders() {
          HttpHeaders headers = new HttpHeaders();
          headers.putAll(super.getHeaders());
          headers.set("X-User-Id", finalUserId);
          headers.set("X-Username", finalUsername);
          headers.set("X-User-Rol", finalRol);
          headers.set("X-Organizacion-Id", finalEmpresaId);
          headers.set("X-Plan-Codigo", finalPlanCodigo);
          if (finalPlanLimites != null) headers.set("X-Plan-Limites", finalPlanLimites);
          if (finalPlanFeatures != null) headers.set("X-Plan-Features", finalPlanFeatures);
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

  private String toJson(Object obj) {
    if (obj == null) return null;
    try {
      return objectMapper.writeValueAsString(obj);
    } catch (JsonProcessingException e) {
      log.warn("No se pudo serializar claim a JSON: {}", e.getMessage());
      return null;
    }
  }
}
