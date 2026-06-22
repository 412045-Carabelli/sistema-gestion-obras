package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/bff/push")
@RequiredArgsConstructor
@Slf4j
public class PushBffController {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.auth.url:http://localhost:8089}")
    private String authServiceUrl;

    @GetMapping("/vapid-key")
    public Mono<ResponseEntity<Map<String, String>>> getVapidKey() {
        return webClientBuilder.build()
                .get()
                .uri(authServiceUrl + "/push/vapid-key")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Error obteniendo VAPID key", ex);
                    return Mono.just(ResponseEntity.<Map<String, String>>status(500).build());
                });
    }

    @PostMapping("/subscribe")
    public Mono<ResponseEntity<Void>> subscribe(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId) {
        ResponseEntity<Void> ok = ResponseEntity.<Void>ok().build();
        ResponseEntity<Void> err = ResponseEntity.<Void>status(500).build();
        return webClientBuilder.build()
                .post()
                .uri(authServiceUrl + "/push/subscribe")
                .header("X-User-Id", userId != null ? userId : "0")
                .header("X-Organizacion-Id", organizacionId != null ? organizacionId : "0")
                .bodyValue(body)
                .retrieve()
                .toBodilessEntity()
                .thenReturn(ok)
                .onErrorReturn(err);
    }

    @PostMapping("/unsubscribe")
    public Mono<ResponseEntity<Void>> unsubscribe(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        ResponseEntity<Void> ok = ResponseEntity.<Void>ok().build();
        return webClientBuilder.build()
                .post()
                .uri(authServiceUrl + "/push/unsubscribe")
                .header("X-User-Id", userId != null ? userId : "0")
                .bodyValue(body)
                .retrieve()
                .toBodilessEntity()
                .thenReturn(ok)
                .onErrorReturn(ok);
    }
}
