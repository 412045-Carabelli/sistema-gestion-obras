package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/tipo-proveedor")
@RequiredArgsConstructor
public class TipoProveedorBffController {

    @Value("${services.proveedores.url}/tipo-proveedor")
    private String PROVEEDORES_URL;

    private final WebClient.Builder webClientBuilder;

    // ===========================
    // 📥 GET - Obtener todos los tipos de proveedor
    // ===========================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getProveedores() {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(PROVEEDORES_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()))
                .map(ResponseEntity::ok);
    }
}
