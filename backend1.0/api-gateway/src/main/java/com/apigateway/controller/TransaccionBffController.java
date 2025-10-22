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
@RequestMapping("/bff/transacciones")
@RequiredArgsConstructor
public class TransaccionBffController {

    @Value("${services.transacciones.url}/tipo_transaccion")
    private String TIPO_TRANSACCIONES_URL;

    @Value("${services.transacciones.url}")
    private String TRANSACCIONES_URL;

    private final WebClient.Builder webClientBuilder;

    // ✅ GET /bff/transacciones
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllTransacciones() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> transaccionesFlux = client.get()
                .uri(TRANSACCIONES_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return transaccionesFlux.collectList().map(ResponseEntity::ok);
    }

    // ✅ GET /bff/transacciones/{id}
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getTransaccionById(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(TRANSACCIONES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    // ✅ GET /bff/transacciones/obra/{obraId}
    @GetMapping("/obra/{obraId}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTransaccionesByObra(@PathVariable("obraId") Long obraId) {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> transaccionesFlux = client.get()
                .uri(TRANSACCIONES_URL + "/obra/{obraId}", obraId)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return transaccionesFlux.collectList().map(ResponseEntity::ok);
    }

    // ✅ POST /bff/transacciones
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> createTransaccion(@RequestBody Map<String, Object> body) {
        WebClient client = webClientBuilder.build();

        return client.post()
                .uri(TRANSACCIONES_URL)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ PUT /bff/transacciones/{id}
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> updateTransaccion(@PathVariable("id") Long id,
                                                                       @RequestBody Map<String, Object> body) {
        WebClient client = webClientBuilder.build();

        return client.put()
                .uri(TRANSACCIONES_URL + "/{id}", id)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ DELETE /bff/transacciones/{id}
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteTransaccion(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.delete()
                .uri(TRANSACCIONES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }
}
