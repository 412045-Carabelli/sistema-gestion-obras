package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/tipo_proveedor")
@RequiredArgsConstructor
public class TipoProveedorBffController {

    private final WebClient.Builder webClientBuilder;

    // URL base del microservicio de proveedores
    private static final String PROVEEDORES_URL = "http://localhost:8083/api/proveedores/tipo_proveedor";

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
