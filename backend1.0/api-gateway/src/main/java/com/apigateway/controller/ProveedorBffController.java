package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/proveedores")
@RequiredArgsConstructor
@Slf4j
public class ProveedorBffController {

    @Value("${services.proveedores.url}")
    private String PROVEEDORES_URL;

    private final WebClient.Builder webClientBuilder;

    // ===============================
    // 🔸 GET /bff/proveedores
    // ===============================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllProveedores(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String rubro,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> proveedoresFlux = client.get()
                .uri(uriBuilder -> {
                    URI base = URI.create(PROVEEDORES_URL);
                    var builder = uriBuilder
                            .scheme(base.getScheme())
                            .host(base.getHost());
                    if (base.getPort() != -1) {
                        builder.port(base.getPort());
                    }
                    if (base.getPath() != null && !base.getPath().isEmpty()) {
                        builder.path(base.getPath());
                    }
                    if (nombre != null && !nombre.isEmpty()) {
                        builder.queryParam("nombre", nombre);
                    }
                    if (rubro != null && !rubro.isEmpty()) {
                        builder.queryParam("rubro", rubro);
                    }
                    if (page != null) {
                        builder.queryParam("page", page);
                    }
                    if (size != null) {
                        builder.queryParam("size", size);
                    }
                    return builder.build();
                })
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return proveedoresFlux.collectList().map(ResponseEntity::ok);
    }

    // ===============================
    // 📥 GET /bff/proveedores/simple
    // ===============================
    @GetMapping("/simple")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getProveedoresSimple() {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(PROVEEDORES_URL + "/simple")
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), response -> {
                    log.error("Error fetching simple proveedores: status={}", response.statusCode());
                    return Mono.error(new RuntimeException("Proveedor service error: " + response.statusCode()));
                })
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Error fetching simple proveedores: {}", ex.getMessage(), ex);
                    return Mono.just(ResponseEntity.status(500).body(List.of()));
                });
    }

    // ===============================
    // 📥 GET /bff/proveedores/all
    // ===============================
    @GetMapping("/all")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllProveedoresSinFiltro() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> proveedoresFlux = client.get()
                .uri(PROVEEDORES_URL + "/all")
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return proveedoresFlux.collectList().map(ResponseEntity::ok);
    }

    // ===============================
    // 🔸 GET /bff/proveedores/{id}
    // ===============================
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getProveedorById(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(PROVEEDORES_URL + "/{id}", id)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), response -> {
                    log.error("Error fetching proveedor {}: status={}", id, response.statusCode());
                    return Mono.error(new RuntimeException("Proveedor " + id + " not found"));
                })
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of())));
    }

    // ===============================
    // 🆕 POST /bff/proveedores
    // ===============================
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> crearProveedor(
            @RequestBody Map<String, Object> proveedorData) {

        return webClientBuilder.build()
                .post()
                .uri(PROVEEDORES_URL)
                .bodyValue(proveedorData)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Error en operación de proveedor", ex);
                    return Mono.just(ResponseEntity.badRequest().build());
                });
    }

    // ===============================
    // 🆕 PUT /bff/proveedores/{id}
    // ===============================
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> actualizarProveedor(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> proveedorData) {

        return webClientBuilder.build()
                .put()
                .uri(PROVEEDORES_URL + "/{id}", id)
                .bodyValue(proveedorData)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Error en operación de proveedor", ex);
                    return Mono.just(ResponseEntity.notFound().build());
                });
    }

    // ===============================
    // 🆕 DELETE /bff/proveedores/{id}
    // ===============================
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> eliminarProveedor(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(PROVEEDORES_URL + "/{id}", id)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), response -> {
                    log.error("Error deleting proveedor {}: status={}", id, response.statusCode());
                    return Mono.error(new RuntimeException("Error deleting proveedor"));
                })
                .bodyToMono(Void.class)
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Error en operación de proveedor", ex);
                    return Mono.just(ResponseEntity.notFound().build());
                });
    }
}
