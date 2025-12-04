package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/bff/tipo-proveedor")
@RequiredArgsConstructor
public class TipoProveedorBffController {

    @Value("${services.proveedores.url}/tipos")
    private String PROVEEDORES_URL;

    private final WebClient.Builder webClientBuilder;

    // ===========================
    // 📥 GET - Obtener todos los tipos de proveedor
    // ===========================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getProveedores() {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(PROVEEDORES_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(this::withLabelAndName)
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()))
                .map(ResponseEntity::ok);
    }

    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> crearTipo(@RequestBody Map<String, Object> body) {
        return webClientBuilder.build()
                .post()
                .uri(PROVEEDORES_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(this::withLabelAndName)
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> actualizarTipo(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return webClientBuilder.build()
                .put()
                .uri(PROVEEDORES_URL + "/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(this::withLabelAndName)
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Object>> eliminarTipo(@PathVariable Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(PROVEEDORES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .map(resp -> ResponseEntity.noContent().build())
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    private Map<String, Object> withLabelAndName(Map<String, Object> raw) {
        Map<String, Object> result = new LinkedHashMap<>(raw != null ? raw : Map.of());
        Object nombre = result.getOrDefault("nombre", result.getOrDefault("name", ""));
        result.put("nombre", nombre);
        result.put("label", result.getOrDefault("label", nombre));
        result.put("name", result.getOrDefault("name", nombre));
        return result;
    }
}
