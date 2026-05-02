package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/clientes")
@RequiredArgsConstructor
public class ClienteBffController {

    @Value("${services.clientes.url}")
    private String CLIENTES_URL;

    private final WebClient.Builder webClientBuilder;

    // ================================
    // 📥 GET - Listar todos los clientes (LITE, rápido)
    // ================================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllClientes(
            @RequestParam Map<String, String> queryParams
    ) {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> clientesFlux = client.get()
                .uri(uriBuilder -> {
                    URI base = URI.create(CLIENTES_URL);
                    var builder = uriBuilder
                            .scheme(base.getScheme())
                            .host(base.getHost());
                    if (base.getPort() != -1) {
                        builder.port(base.getPort());
                    }
                    if (base.getPath() != null && !base.getPath().isEmpty()) {
                        builder.path(base.getPath());
                    }
                    if (queryParams != null && !queryParams.isEmpty()) {
                        queryParams.forEach(builder::queryParam);
                    }
                    return builder.build();
                })
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return clientesFlux.collectList().map(ResponseEntity::ok);
    }

    // ================================
    // 📥 GET - Listar clientes CON DETALLES (paginado)
    // IMPORTANTE: Este endpoint debe ir ANTES de /{id} para evitar conflictos de routing
    // ================================
    @GetMapping("/con-detalles")
    public Mono<ResponseEntity<Map<String, Object>>> getAllClientesConDetalles(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size
    ) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(CLIENTES_URL + "/con-detalles?page={page}&size={size}", page, size)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    // ================================
    // 📥 GET - Obtener cliente por ID
    // ================================
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getClienteById(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(CLIENTES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    // ================================
    // ➕ POST - Crear cliente
    // ================================
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> createCliente(@RequestBody Map<String, Object> clienteData) {
        WebClient client = webClientBuilder.build();

        return client.post()
                .uri(CLIENTES_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(clienteData)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    // ================================
    // ✏️ PUT - Actualizar cliente
    // ================================
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> updateCliente(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> clienteData
    ) {
        WebClient client = webClientBuilder.build();

        return client.put()
                .uri(CLIENTES_URL + "/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(clienteData)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().build()));
    }

    // ================================
    // 🗑️ DELETE - Eliminar cliente
    // ================================
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Object>> deleteCliente(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.delete()
                .uri(CLIENTES_URL + "/{id}", id)
                .retrieve()
                .toBodilessEntity()
                .map(response -> ResponseEntity.noContent().build())
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    // ================================
    // GET - Condiciones IVA
    // ================================
    @GetMapping("/condicion-iva")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getCondicionIva() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> condicionesFlux = client.get()
                .uri(CLIENTES_URL + "/condicion-iva")
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return condicionesFlux.collectList().map(ResponseEntity::ok);
    }
}
