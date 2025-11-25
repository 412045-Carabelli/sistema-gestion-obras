package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bff/condicion-iva")
@RequiredArgsConstructor
public class CondicionIvaBffController {

    @Value("${services.clientes.url}/condicion-iva")
    private String CONDICION_URL;

    private final WebClient.Builder webClientBuilder;

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, String>>>> listarCondiciones() {
        return webClientBuilder.build()
                .get()
                .uri(CONDICION_URL)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<String>>() {})
                .defaultIfEmpty(List.of())
                .map(list -> list.stream()
                        .map(this::toOption)
                        .collect(Collectors.toList()))
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.ok(List.of())));
    }

    private Map<String, String> toOption(String valor) {
        return Map.of(
                "label", valor,
                "name", valor
        );
    }
}
