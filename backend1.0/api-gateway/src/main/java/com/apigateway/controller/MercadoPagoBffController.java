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

import java.util.Map;

/**
 * BFF para la integración Mercado Pago (suscripciones / checkout).
 *
 * Endpoints:
 *   POST   /bff/mp/suscribir              → auth-service POST /auth/mp/suscribir
 *   GET    /bff/mp/suscripcion/estado     → auth-service GET  /auth/mp/suscripcion/estado
 *   DELETE /bff/mp/suscripcion/cancelar   → auth-service DELETE /auth/mp/suscripcion/cancelar
 *   POST   /bff/mp/webhook                → auth-service POST /auth/mp/webhook (público — sin JWT)
 */
@RestController
@RequestMapping("/bff/mp")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class MercadoPagoBffController {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.auth.url:http://localhost:8089}")
    private String authServiceUrl;

    // -------------------------------------------------------------------------
    // POST /bff/mp/suscribir
    // -------------------------------------------------------------------------

    @PostMapping("/suscribir")
    public Mono<ResponseEntity<Map<String, Object>>> suscribir(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId,
            @RequestHeader(value = "X-Username", required = false) String username) {

        return webClientBuilder.build()
                .post()
                .uri(authServiceUrl + "/auth/mp/suscribir")
                .header("X-Org-Id", organizacionId != null ? organizacionId : "0")
                .header("X-Username", username != null ? username : "")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error iniciando suscripción MP: {} {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.just(ResponseEntity.<Map<String, Object>>status(ex.getStatusCode()).build());
                })
                .onErrorResume(ex -> {
                    log.error("Error inesperado iniciando suscripción MP", ex);
                    return Mono.just(ResponseEntity.<Map<String, Object>>status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }

    // -------------------------------------------------------------------------
    // GET /bff/mp/suscripcion/estado
    // -------------------------------------------------------------------------

    @GetMapping("/suscripcion/estado")
    public Mono<ResponseEntity<Map<String, Object>>> consultarEstado(
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId) {

        return webClientBuilder.build()
                .get()
                .uri(authServiceUrl + "/auth/mp/suscripcion/estado")
                .header("X-Org-Id", organizacionId != null ? organizacionId : "0")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.NotFound.class, ex ->
                        Mono.just(ResponseEntity.<Map<String, Object>>notFound().build()))
                .onErrorResume(ex -> {
                    log.error("Error consultando estado MP", ex);
                    return Mono.just(ResponseEntity.<Map<String, Object>>status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }

    // -------------------------------------------------------------------------
    // DELETE /bff/mp/suscripcion/cancelar
    // -------------------------------------------------------------------------

    @DeleteMapping("/suscripcion/cancelar")
    public Mono<ResponseEntity<Void>> cancelar(
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId) {

        ResponseEntity<Void> ok  = ResponseEntity.<Void>noContent().build();
        ResponseEntity<Void> err = ResponseEntity.<Void>status(HttpStatus.INTERNAL_SERVER_ERROR).build();

        return webClientBuilder.build()
                .delete()
                .uri(authServiceUrl + "/auth/mp/suscripcion/cancelar")
                .header("X-Org-Id", organizacionId != null ? organizacionId : "0")
                .retrieve()
                .toBodilessEntity()
                .<ResponseEntity<Void>>thenReturn(ok)
                .onErrorReturn(err);
    }

    // -------------------------------------------------------------------------
    // POST /bff/mp/webhook  — público (no JWT)
    // -------------------------------------------------------------------------

    @PostMapping("/webhook")
    public Mono<ResponseEntity<Void>> webhook(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "x-signature", required = false) String signature,
            @RequestHeader(value = "x-request-id", required = false) String requestId,
            @RequestParam(required = false) String type,
            @RequestParam(name = "data.id", required = false) String dataId) {

        // Reconstruir query string para validación HMAC en auth-service
        String queryString = "";
        if (dataId != null) queryString += "data.id=" + dataId;
        if (type != null) queryString += (queryString.isEmpty() ? "" : "&") + "type=" + type;

        ResponseEntity<Void> ok = ResponseEntity.<Void>ok().build();
        String url = authServiceUrl + "/auth/mp/webhook" + (queryString.isEmpty() ? "" : "?" + queryString);

        return webClientBuilder.build()
                .post()
                .uri(url)
                .headers(h -> {
                    if (signature != null)  h.set("x-signature", signature);
                    if (requestId != null)  h.set("x-request-id", requestId);
                })
                .bodyValue(body)
                .retrieve()
                .toBodilessEntity()
                .<ResponseEntity<Void>>thenReturn(ok)
                .onErrorReturn(ok); // siempre 200 a MP
    }
}
