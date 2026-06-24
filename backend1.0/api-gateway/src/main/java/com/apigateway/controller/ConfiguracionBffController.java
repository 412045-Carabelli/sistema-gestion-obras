package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/bff/configuracion")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConfiguracionBffController {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.obras.base.url:http://obras-service:8081}")
    private String obrasBaseUrl;

    @GetMapping
    public Mono<ResponseEntity<Map<String, String>>> obtener(
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId) {
        return webClientBuilder.build()
            .get()
            .uri(obrasBaseUrl + "/api/configuracion")
            .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
            .map(ResponseEntity::ok);
    }

    @PutMapping
    public Mono<ResponseEntity<Map<String, String>>> actualizar(
            @RequestBody Map<String, String> valores,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId) {
        return webClientBuilder.build()
            .put()
            .uri(obrasBaseUrl + "/api/configuracion")
            .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
            .bodyValue(valores)
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
            .map(ResponseEntity::ok);
    }
}
