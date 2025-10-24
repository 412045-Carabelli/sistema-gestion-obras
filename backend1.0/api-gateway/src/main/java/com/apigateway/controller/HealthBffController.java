package com.apigateway.controller;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/bff/health")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HealthBffController {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.obras}")         private String obras;
    @Value("${services.clientes}")      private String clientes;
    @Value("${services.proveedores}")   private String proveedores;
    @Value("${services.transacciones}") private String transacciones;
    @Value("${services.documentos}")    private String documentos;

    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    @GetMapping
    public Mono<ResponseEntity<Map<String, Object>>> checkAll() {
        Map<String, String> targets = Map.of(
                "obras",         obras + "/health",
                "clientes",      clientes + "/health",
                "proveedores",   proveedores + "/health",
                "transacciones", transacciones + "/health",
                "documentos",    documentos + "/health"
        );

        WebClient client = webClientBuilder.build();

        return Flux.fromIterable(targets.entrySet())
                .flatMap(entry -> ping(client, entry.getKey(), entry.getValue()))
                .collectMap(ServiceStatus::name, ServiceStatus::toMap)
                .map(map -> {
                    boolean allUp = ((Collection<?>) map.get("UP")).size() == targets.size();
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("status", allUp ? "UP" : "DEGRADED");
                    payload.putAll(map);
                    return ResponseEntity.status(allUp ? HttpStatus.OK : HttpStatus.MULTI_STATUS).body(payload);
                });
    }

    @CircuitBreaker(name = "svcHealth", fallbackMethod = "fallback")
    @Retry(name = "svcHealth")
    Mono<ServiceStatus> ping(WebClient client, String name, String url) {
        return client.head().uri(url)
                .exchangeToMono(resp -> Mono.just(resp.statusCode().is2xxSuccessful()))
                .timeout(TIMEOUT)
                .onErrorReturn(false)
                .map(up -> new ServiceStatus(name, url, up));
    }

    Mono<ServiceStatus> fallback(String name, String url, Throwable ex) {
        return Mono.just(new ServiceStatus(name, url, false));
    }

    static final class ServiceStatus {
        final String name, url; final boolean up;
        ServiceStatus(String n, String u, boolean up){ this.name=n; this.url=u; this.up=up; }
        String name(){ return up ? "UP" : "DOWN"; }
        Map<String,Object> toMap(){ return Map.of("name",name,"url",url,"up",up); }
    }
}
