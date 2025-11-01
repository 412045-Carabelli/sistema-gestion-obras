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
@RequestMapping("/bff/estados-obras")
@RequiredArgsConstructor
public class EstadosObraBffController {

    @Value("${services.obras.url}/estados")
    private String ESTADOS_OBRAS_URL;

    private final WebClient.Builder webClientBuilder;

    // ================================
    // 📜 GET - Listar todos los estados
    // ================================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllEstados() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> estadosFlux = client.get()
                .uri(ESTADOS_OBRAS_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return estadosFlux.collectList()
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    Map<String, Object> err = Map.of(
                            "error", "No se pudieron obtener los estados de obra",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(List.of(err)));
                });
    }

    // ================================
    // 📄 GET - Obtener estado por ID
    // ================================
    @GetMapping("/{idEstado}")
    public Mono<ResponseEntity<Map<String, Object>>> getEstadoById(@PathVariable("idEstado") Long idEstado) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(ESTADOS_OBRAS_URL + "/{id}", idEstado)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    Map<String, Object> err = Map.of(
                            "error", "No se pudo obtener el estado de obra",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(err));
                });
    }
}