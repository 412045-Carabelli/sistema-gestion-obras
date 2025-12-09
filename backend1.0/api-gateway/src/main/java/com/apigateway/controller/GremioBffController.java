package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/gremios")
@RequiredArgsConstructor
public class GremioBffController {

    @Value("${services.proveedores.url}")
    private String PROVEEDORES_URL;

    private final WebClient.Builder webClientBuilder;

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAll() {
        WebClient client = webClientBuilder.build();
        Flux<Map<String, Object>> flux = client.get()
                .uri(PROVEEDORES_URL.replace("/api/proveedores", "/api/gremios"))
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});
        return flux.collectList().map(ResponseEntity::ok);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getOne(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();
        return client.get()
                .uri(PROVEEDORES_URL.replace("/api/proveedores", "/api/gremios") + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> create(@RequestBody Map<String, Object> payload) {
        WebClient client = webClientBuilder.build();
        return client.post()
                .uri(PROVEEDORES_URL.replace("/api/proveedores", "/api/gremios"))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> update(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        WebClient client = webClientBuilder.build();
        return client.put()
                .uri(PROVEEDORES_URL.replace("/api/proveedores", "/api/gremios") + "/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();
        return client.delete()
                .uri(PROVEEDORES_URL.replace("/api/proveedores", "/api/gremios") + "/{id}", id)
                .retrieve()
                .toBodilessEntity()
                .map(r -> ResponseEntity.noContent().<Void>build())
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }
}
