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
@RequestMapping("/bff/tipo-transaccion")
@RequiredArgsConstructor
public class TipoTransaccionBffController {

    @Value("${services.transacciones.url}/tipo-transaccion")
    private String TIPO_TRANSACCIONES_URL;

    private final WebClient.Builder webClientBuilder;

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllTipos() {
        WebClient client = webClientBuilder.build();
        Flux<Map<String, Object>> flux = client.get()
                .uri(TIPO_TRANSACCIONES_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});
        return flux.collectList().map(ResponseEntity::ok);
    }

    @GetMapping("/{tipo}")
    public Mono<ResponseEntity<Map<String, Object>>> getTipoByNombre(@PathVariable String tipo) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(TIPO_TRANSACCIONES_URL + "/{tipo}", tipo)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

}
