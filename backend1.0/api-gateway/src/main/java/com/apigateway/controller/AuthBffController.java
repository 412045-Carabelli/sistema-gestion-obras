package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * BFF para endpoints de auth-service que el frontend consume directamente.
 *
 * Endpoints públicos (sin JWT):
 *   GET  /auth/planes      → auth-service GET  /auth/planes   (pricing page)
 *   POST /auth/register    → auth-service POST /auth/register (self-service signup)
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AuthBffController {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.auth.url:http://localhost:8089}")
    private String authServiceUrl;

    // -------------------------------------------------------------------------
    // GET /auth/planes  — público, sin JWT (pricing page)
    // -------------------------------------------------------------------------

    @GetMapping("/planes")
    public Mono<ResponseEntity<List<Map<String, Object>>>> listarPlanes() {
        return webClientBuilder.build()
                .get()
                .uri(authServiceUrl + "/auth/planes")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error obteniendo planes desde auth-service: {} {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.just(ResponseEntity.<List<Map<String, Object>>>status(ex.getStatusCode()).build());
                })
                .onErrorResume(ex -> {
                    log.error("Error inesperado obteniendo planes", ex);
                    return Mono.just(ResponseEntity.<List<Map<String, Object>>>status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }

    // -------------------------------------------------------------------------
    // POST /auth/register  — público, sin JWT (auto-registro de nuevos clientes)
    // -------------------------------------------------------------------------

    @PostMapping("/register")
    public Mono<ResponseEntity<Map<String, Object>>> register(@RequestBody Map<String, Object> body) {
        return webClientBuilder.build()
                .post()
                .uri(authServiceUrl + "/auth/register")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("Error en register desde auth-service: {} {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    // Propaga el body del auth-service tal cual (ya tiene estructura {message: ...})
                    return Mono.just(ResponseEntity.<Map<String, Object>>status(ex.getStatusCode()).build());
                })
                .onErrorResume(ex -> {
                    log.error("Error inesperado en register", ex);
                    return Mono.just(ResponseEntity.<Map<String, Object>>status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("message", "Error interno del servidor")));
                });
    }
}
