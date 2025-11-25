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
@RequestMapping("/bff/clientes")
@RequiredArgsConstructor
public class ClienteBffController {

    @Value("${services.clientes.url}")
    private String CLIENTES_URL;

    private final WebClient.Builder webClientBuilder;

    // ================================
    // 📥 GET - Listar todos los clientes
    // ================================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllClientes() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> clientesFlux = client.get()
                .uri(CLIENTES_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return clientesFlux.collectList().map(ResponseEntity::ok);
    }

    // ================================
    // 📥 GET - Obtener cliente por ID
    // ================================
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getClienteById(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(CLIENTES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    // ================================
    // ➕ POST - Crear cliente
    // ================================
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> createCliente(@RequestBody Map<String, Object> clienteData) {
        WebClient client = webClientBuilder.build();

        return client.post()
                .uri(CLIENTES_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(normalizar(clienteData))
                .exchangeToMono(resp -> resp.toEntity(new ParameterizedTypeReference<Map<String, Object>>() {}))
                .map(r -> ResponseEntity.status(r.getStatusCode()).body(r.getBody()))
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    // ================================
    // ✏️ PUT - Actualizar cliente
    // ================================
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> updateCliente(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> clienteData
    ) {
        WebClient client = webClientBuilder.build();

        return client.put()
                .uri(CLIENTES_URL + "/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(normalizar(clienteData))
                .exchangeToMono(resp -> resp.toEntity(new ParameterizedTypeReference<Map<String, Object>>() {}))
                .map(r -> ResponseEntity.status(r.getStatusCode()).body(r.getBody()))
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    // ================================
    // 🗑️ DELETE - Eliminar cliente
    // ================================
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Object>> deleteCliente(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.delete()
                .uri(CLIENTES_URL + "/{id}", id)
                .retrieve()
                .toBodilessEntity()
                .map(response -> ResponseEntity.noContent().build())
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    @PatchMapping("/{id}/activar")
    public Mono<ResponseEntity<Object>> activar(@PathVariable Long id) {
        return webClientBuilder.build()
                .patch()
                .uri(CLIENTES_URL + "/{id}/activar", id)
                .retrieve()
                .toBodilessEntity()
                .map(resp -> ResponseEntity.ok().build())
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    @PatchMapping("/{id}/desactivar")
    public Mono<ResponseEntity<Object>> desactivar(@PathVariable Long id) {
        return webClientBuilder.build()
                .patch()
                .uri(CLIENTES_URL + "/{id}/desactivar", id)
                .retrieve()
                .toBodilessEntity()
                .map(resp -> ResponseEntity.ok().build())
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    private Map<String, Object> normalizar(Map<String, Object> raw) {
        if (raw == null) return Map.of();
        var map = new java.util.HashMap<>(raw);
        Object cond = map.getOrDefault("condicion_iva", map.get("condicionIVA"));
        if (cond != null) {
            map.put("condicionIVA", cond);
            map.remove("condicion_iva");
        }
        return map;
    }
}
