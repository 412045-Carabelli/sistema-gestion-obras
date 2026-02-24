package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/auditoria")
@RequiredArgsConstructor
public class AuditoriaBffController {

    @Value("${services.obras.audit.url}")
    private String AUDITORIA_URL;
    @Value("${services.clientes.audit.url}")
    private String AUDITORIA_CLIENTES_URL;
    @Value("${services.proveedores.audit.url}")
    private String AUDITORIA_PROVEEDORES_URL;
    @Value("${services.documentos.audit.url}")
    private String AUDITORIA_DOCUMENTOS_URL;
    @Value("${services.transacciones.audit.url}")
    private String AUDITORIA_TRANSACCIONES_URL;

    private final WebClient.Builder webClientBuilder;

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> listar(@RequestParam Map<String, String> params) {
        WebClient client = webClientBuilder.build();

        List<String> urls = List.of(
                buildUrl(AUDITORIA_URL, params),
                buildUrl(AUDITORIA_CLIENTES_URL, params),
                buildUrl(AUDITORIA_PROVEEDORES_URL, params),
                buildUrl(AUDITORIA_DOCUMENTOS_URL, params),
                buildUrl(AUDITORIA_TRANSACCIONES_URL, params)
        );

        return Flux.fromIterable(urls)
                .flatMap(url -> client.get()
                        .uri(url)
                        .retrieve()
                        .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .onErrorResume(ex -> Flux.empty())
                )
                .collectList()
                .map(list -> {
                    list.sort(Comparator.comparing(this::parseFecha).reversed());
                    return ResponseEntity.ok(list);
                })
                .onErrorResume(ex -> {
                    Map<String, Object> err = Map.of(
                            "error", "No se pudieron obtener los registros de auditoria",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(List.of(err)));
                });
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> obtener(
            @PathVariable("id") Long id,
            @RequestParam(name = "modulo", required = false) String modulo
    ) {
        WebClient client = webClientBuilder.build();
        if (modulo != null && !modulo.isBlank()) {
            String target = resolveByModulo(modulo);
            if (target != null) {
                return fetchById(client, target, id);
            }
        }

        List<String> urls = List.of(
                AUDITORIA_URL,
                AUDITORIA_CLIENTES_URL,
                AUDITORIA_PROVEEDORES_URL,
                AUDITORIA_DOCUMENTOS_URL,
                AUDITORIA_TRANSACCIONES_URL
        );

        return Flux.fromIterable(urls)
                .flatMap(url -> fetchById(client, url, id).flatMap(resp -> {
                    if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                        return Mono.just(resp);
                    }
                    return Mono.empty();
                }))
                .next()
                .switchIfEmpty(Mono.just(ResponseEntity.notFound().build()));
    }

    private String buildUrl(String baseUrl, Map<String, String> params) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl);
        if (params != null) {
            params.forEach((key, value) -> {
                if (value != null && !value.isBlank()) {
                    builder.queryParam(key, value);
                }
            });
        }
        return builder.toUriString();
    }

    private Mono<ResponseEntity<Map<String, Object>>> fetchById(WebClient client, String baseUrl, Long id) {
        return client.get()
                .uri(baseUrl + "/" + id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.internalServerError().body(Map.of(
                        "error", "No se pudo obtener el registro de auditoria",
                        "detalle", ex.getMessage()
                ))));
    }

    private String resolveByModulo(String modulo) {
        String key = modulo.trim().toLowerCase();
        if (key.contains("obras")) return AUDITORIA_URL;
        if (key.contains("clientes")) return AUDITORIA_CLIENTES_URL;
        if (key.contains("proveedores")) return AUDITORIA_PROVEEDORES_URL;
        if (key.contains("documentos")) return AUDITORIA_DOCUMENTOS_URL;
        if (key.contains("transacciones")) return AUDITORIA_TRANSACCIONES_URL;
        return null;
    }

    private Instant parseFecha(Map<String, Object> row) {
        Object raw = row.get("fechaHora");
        if (raw == null) raw = row.get("fecha_hora");
        if (raw == null) return Instant.EPOCH;
        try {
            return Instant.parse(String.valueOf(raw));
        } catch (Exception ignored) {
            return Instant.EPOCH;
        }
    }
}
