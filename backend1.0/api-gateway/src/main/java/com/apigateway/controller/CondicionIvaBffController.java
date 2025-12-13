package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/condicion-iva")
@RequiredArgsConstructor
public class CondicionIvaBffController {

    @Value("${services.clientes.url}")
    private String CLIENTES_URL;

    private final WebClient.Builder webClientBuilder;

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getCondicionesIva() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> condicionesFlux = client.get()
                .uri(CLIENTES_URL + "/condicion-iva")
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return condicionesFlux.collectList().map(ResponseEntity::ok);
    }
}
