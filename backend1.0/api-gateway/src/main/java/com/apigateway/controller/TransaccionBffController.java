package com.apigateway.controller;

import com.apigateway.service.PushTriggerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/transacciones")
@RequiredArgsConstructor
@Slf4j
public class TransaccionBffController {

    @Value("${services.transacciones.url}/tipo-transaccion")
    private String TIPO_TRANSACCIONES_URL;

    @Value("${services.transacciones.url}")
    private String TRANSACCIONES_URL;

    @Value("${services.obras.url}")
    private String OBRAS_URL;

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final PushTriggerService pushTriggerService;

    // ✅ GET /bff/transacciones
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllTransacciones(
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") String organizacionId) {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> transaccionesFlux = client.get()
                .uri(TRANSACCIONES_URL)
                .header("X-Organizacion-Id", organizacionId)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return transaccionesFlux.collectList().map(ResponseEntity::ok);
    }

    // ✅ GET /bff/transacciones/con-asociados (paginado con nombres de clientes/proveedores)
    @GetMapping("/con-asociados")
    public Mono<ResponseEntity<Map<String, Object>>> getAllConAsociados(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") String organizacionId
    ) {
        WebClient client = webClientBuilder.build();

        String url = UriComponentsBuilder.fromHttpUrl(TRANSACCIONES_URL + "/con-asociados")
                .queryParam("page", page)
                .queryParam("size", size)
                .build()
                .toUriString();

        return client.get()
                .uri(url)
                .header("X-Organizacion-Id", organizacionId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Error en operación de transacciones", ex);
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    // ✅ GET /bff/transacciones/{id}
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getTransaccionById(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(TRANSACCIONES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.notFound().build()));
    }

    // ✅ GET /bff/transacciones/obra/{obraId}
    @GetMapping("/obra/{obraId}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTransaccionesByObra(@PathVariable("obraId") Long obraId) {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> transaccionesFlux = client.get()
                .uri(TRANSACCIONES_URL + "/obra/{obraId}", obraId)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return transaccionesFlux.collectList().map(ResponseEntity::ok);
    }

    @PostMapping("/obra/{obraId}/comisiones/pago")
    public Mono<ResponseEntity<Object>> pagarComision(
            @PathVariable("obraId") Long obraId,
            @RequestBody(required = false) Map<String, Object> body) {
        WebClient client = webClientBuilder.build();
        return client.post()
                .uri(TRANSACCIONES_URL + "/obra/{obraId}/comisiones/pago", obraId)
                .bodyValue(body != null ? body : Map.of())
                .exchangeToMono(response -> response.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .map(payload -> {
                            if (payload != null && !payload.isBlank()) {
                                try {
                                    Map<String, Object> parsed = objectMapper.readValue(
                                            payload, new TypeReference<Map<String, Object>>() {});
                                    return ResponseEntity.status(response.statusCode()).body(parsed);
                                } catch (Exception ignored) {
                                    return ResponseEntity.status(response.statusCode()).body(payload);
                                }
                            }
                            return ResponseEntity.status(response.statusCode()).build();
                        }));
    }

    // ✅ POST /bff/transacciones
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> createTransaccion(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") String organizacionId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName) {
        WebClient client = webClientBuilder.build();

        return client.post()
                .uri(TRANSACCIONES_URL)
                .header("X-Organizacion-Id", organizacionId)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnNext(resp -> {
                    String tipo = String.valueOf(resp.getOrDefault("tipo_transaccion", ""));
                    Object montoObj = resp.get("monto");
                    String monto = montoObj != null ? "$" + montoObj : "";
                    String desc = (tipo + " " + monto).trim();
                    pushTriggerService.triggerNotification(organizacionId, userId, userName, "movimiento", desc);
                })
                .map(ResponseEntity::ok);
    }

    // ✅ PUT /bff/transacciones/{id}
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> updateTransaccion(@PathVariable("id") Long id,
                                                                       @RequestBody Map<String, Object> body) {
        WebClient client = webClientBuilder.build();

        return client.put()
                .uri(TRANSACCIONES_URL + "/{id}", id)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ DELETE /bff/transacciones/{id}
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteTransaccion(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        return client.delete()
                .uri(TRANSACCIONES_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }

    @GetMapping("/asociado/{tipo}/{id}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTransaccionesPorAsociado(
            @PathVariable("tipo") String tipo,
            @PathVariable("id") Long id) {

        return webClientBuilder.build()
                .get()
                .uri(TRANSACCIONES_URL + "/asociado/{tipo}/{id}", tipo, id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(ResponseEntity::ok);
    }
    private Long parseLongSafe(Object value) {
        if (value == null) return null;
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) return null;
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
