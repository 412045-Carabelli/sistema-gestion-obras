package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/proveedores")
@RequiredArgsConstructor
public class ProveedorBffController {

    @Value("${services.proveedores.url}")
    private String PROVEEDORES_URL;

    private final WebClient.Builder webClientBuilder;

    // ===============================
    // 🔸 GET /bff/proveedores
    // ===============================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllProveedores() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> proveedoresFlux = client.get()
                .uri(PROVEEDORES_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return proveedoresFlux.collectList().map(ResponseEntity::ok);
    }

    // ===============================
    // 🔸 GET /bff/proveedores/{id}
    // ===============================
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getProveedorById(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(PROVEEDORES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    // ===============================
    // 🆕 POST /bff/proveedores
    // ===============================
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> crearProveedor(
            @RequestBody Map<String, Object> proveedorData) {

        return webClientBuilder.build()
                .post()
                .uri(PROVEEDORES_URL)
                .bodyValue(proveedorData)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    return Mono.just(ResponseEntity.badRequest().build());
                });
    }

    // ===============================
    // 🆕 PUT /bff/proveedores/{id}
    // ===============================
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> actualizarProveedor(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> proveedorData) {

        return webClientBuilder.build()
                .put()
                .uri(PROVEEDORES_URL + "/{id}", id)
                .bodyValue(proveedorData)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    return Mono.just(ResponseEntity.notFound().build());
                });
    }

    // ===============================
    // 🆕 DELETE /bff/proveedores/{id}
    // ===============================
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> eliminarProveedor(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(PROVEEDORES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    return Mono.just(ResponseEntity.notFound().build());
                });
    }
}
