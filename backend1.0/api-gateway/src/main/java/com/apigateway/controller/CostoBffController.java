package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/costos")
@RequiredArgsConstructor
public class CostoBffController {

    @Value("${services.obras.url}/costos")
    private String COSTOS_URL;

    private final WebClient.Builder webClientBuilder;

    // 🔸 GET /bff/costos/{idObra}
    @GetMapping("/{idObra}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getCostosPorObra(@PathVariable("idObra") Long idObra) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(COSTOS_URL + "/{idObra}", idObra)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()))
                .map(ResponseEntity::ok);
    }

    @PutMapping("/{id}/estado/{estado}")
    public Mono<ResponseEntity<Map<String, Object>>> actualizarEstadoPago(
            @PathVariable("id") Long idCosto,
            @PathVariable("estado") String estado) {

        WebClient client = webClientBuilder.build();

        return client.put()
                .uri(COSTOS_URL + "/{id}/estado/{estado}", idCosto, estado)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    @PostMapping("/{idObra}")
    public Mono<ResponseEntity<Map<String, Object>>> crearCosto(
            @PathVariable("idObra") Long idObra,
            @RequestBody Map<String, Object> body
    ) {
        WebClient client = webClientBuilder.build();
        return client.post()
                .uri(COSTOS_URL + "/{idObra}", idObra)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @PutMapping("/{idCosto}")
    public Mono<ResponseEntity<Map<String, Object>>> actualizarCosto(
            @PathVariable("idCosto") Long idCosto,
            @RequestBody Map<String, Object> body
    ) {
        return webClientBuilder.build()
                .put()
                .uri(COSTOS_URL + "/{id}", idCosto)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.status(500).build()));
    }

    @DeleteMapping("/{idCosto}")
    public Mono<ResponseEntity<Object>> eliminarCosto(@PathVariable("idCosto") Long idCosto) {
        return webClientBuilder.build()
                .delete()
                .uri(COSTOS_URL + "/{id}", idCosto)
                .retrieve()
                .bodyToMono(Void.class)
                .map(resp -> ResponseEntity.noContent().build())
                .onErrorResume(ex -> Mono.just(ResponseEntity.status(500).build()));
    }
}
