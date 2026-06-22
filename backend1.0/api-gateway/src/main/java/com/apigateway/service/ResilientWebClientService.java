package com.apigateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResilientWebClientService {

    private final WebClient.Builder webClientBuilder;

    /**
     * Llamada resiliente con fallback a Map vacío si falla
     */
    public Mono<Map<String, Object>> getWithFallback(String url, String serviceName) {
        return webClientBuilder.build()
                .get()
                .uri(url)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(ex -> {
                    log.warn("Servicio {} no disponible en {}: {}", serviceName, url, ex.getMessage());
                    return Mono.just(Map.of(
                            "error", true,
                            "unavailable", true,
                            "service", serviceName
                    ));
                });
    }

    /**
     * Enriquecimiento con fallback: si el servicio falla, devuelve datos parciales
     */
    public Mono<Map<String, Object>> enrichWithService(
            Map<String, Object> baseData,
            String serviceUrl,
            String serviceName,
            String enrichmentKey) {

        return getWithFallback(serviceUrl, serviceName)
                .map(enrichmentData -> {
                    baseData.put(enrichmentKey, enrichmentData);
                    return baseData;
                });
    }
}
