package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/estados_obras")
@RequiredArgsConstructor
public class EstadosObraBffController {

    @Value("${services.obras.estado_obra.url}")
    private String ESTADOS_OBRAS_URL;

    private final WebClient.Builder webClientBuilder;

    // ✅ GET /bff/tipo_documentos
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAll() {
        WebClient client = webClientBuilder.build();
        Flux<Map<String, Object>> flux = client.get()
                .uri(ESTADOS_OBRAS_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});
        return flux.collectList().map(ResponseEntity::ok);
    }

    // ✅ GET /bff/tipo_documentos/{id}
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getById(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();
        return client.get()
                .uri(ESTADOS_OBRAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.notFound().build()));
    }

}
