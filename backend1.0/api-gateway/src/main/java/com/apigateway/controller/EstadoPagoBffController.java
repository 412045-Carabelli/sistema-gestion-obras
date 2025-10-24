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

@RestController
@RequestMapping("/bff/estado_pago")
@RequiredArgsConstructor
public class EstadoPagoBffController {

    @Value("${services.obras.url}/estado_pago")
    private String ESTADO_PAGO_URL;

    private final WebClient.Builder webClientBuilder;

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getEstadosPago() {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(ESTADO_PAGO_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()))
                .map(ResponseEntity::ok);
    }
}
