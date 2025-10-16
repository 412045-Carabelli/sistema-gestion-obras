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

    @Value("${services.obras.costos.url}")
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

    @PutMapping("/{id}/estado/{idEstado}")
    public Mono<ResponseEntity<Map<String, Object>>> actualizarEstadoPago(
            @PathVariable("id") Long idCosto,
            @PathVariable("idEstado") Long idEstadoPago) {

        WebClient client = webClientBuilder.build();

        return client.put()
                .uri(COSTOS_URL + "/{id}/estado/{idEstado}", idCosto, idEstadoPago)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

}
