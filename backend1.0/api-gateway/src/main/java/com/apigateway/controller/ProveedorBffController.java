package com.apigateway.controller;

import com.apigateway.service.PushTriggerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
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
    private final PushTriggerService pushTriggerService;

    // ===============================
    // 🔸 GET /bff/proveedores
    // ===============================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllProveedores(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String rubro,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestHeader(value = "X-Organizacion-Id", required = false, defaultValue = "0") String organizacionId
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
                .header("X-Organizacion-Id", organizacionId)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return proveedoresFlux.collectList().map(ResponseEntity::ok);
    }

    // ===============================
    // 📥 GET /bff/proveedores/simple
    // ===============================
    @GetMapping("/simple")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getProveedoresSimple(
            @RequestHeader(value = "X-Organizacion-Id", required = false, defaultValue = "0") String organizacionId) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(PROVEEDORES_URL + "/simple")
                .header("X-Organizacion-Id", organizacionId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(ResponseEntity::ok);
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
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    // ===============================
    // 🆕 POST /bff/proveedores
    // ===============================
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> crearProveedor(
            @RequestBody Map<String, Object> proveedorData,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName) {

        return webClientBuilder.build()
                .post()
                .uri(PROVEEDORES_URL)
                .bodyValue(proveedorData)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnNext(body -> pushTriggerService.triggerNotification(
                        organizacionId, userId, userName,
                        "proveedor", String.valueOf(body.getOrDefault("nombre", body.getOrDefault("razon_social", "")))))
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
                .bodyToMono(Void.class)
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Error en operación de proveedor", ex);
                    return Mono.just(ResponseEntity.notFound().build());
                });
    }
}
