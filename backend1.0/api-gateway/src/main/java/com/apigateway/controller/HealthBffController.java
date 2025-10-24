package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/bff/health")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HealthBffController {

    private final WebClient.Builder webClientBuilder;

    @GetMapping
    public Mono<Map<String, Object>> checkAllServices() {
        Map<String, String> services = Map.of(
                "obras", "https://obras-service.onrender.com/health",
                "clientes", "https://clientes-service.onrender.com/health",
                "proveedores", "https://proveedores-service.onrender.com/health",
                "transacciones", "https://transacciones-service.onrender.com/health",
                "documentos", "https://documentos-service.onrender.com/health"
        );

        Map<String, Object> result = new LinkedHashMap<>();

        return Mono.zip(
                services.entrySet().stream()
                        .map(entry -> ping(entry.getKey(), entry.getValue()))
                        .toList(),
                responses -> {
                    for (int i = 0; i < responses.length; i++) {
                        var response = (Map.Entry<String, Boolean>) responses[i];
                        result.put(response.getKey(), response.getValue());
                    }
                    result.put("status", result.values().stream().allMatch(v -> v.equals(true)) ? "UP" : "DOWN");
                    return result;
                }
        );
    }

    private Mono<Map.Entry<String, Boolean>> ping(String name, String url) {
        return webClientBuilder.build()
                .get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .map(res -> Map.entry(name, true))
                .onErrorReturn(Map.entry(name, false));
    }
}
