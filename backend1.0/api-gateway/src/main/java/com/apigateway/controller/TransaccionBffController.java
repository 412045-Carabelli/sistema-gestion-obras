package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/transacciones")
@RequiredArgsConstructor
public class TransaccionBffController {

    @Value("${services.transacciones.url}/tipo-transaccion")
    private String TIPO_TRANSACCIONES_URL;

    @Value("${services.transacciones.url}")
    private String TRANSACCIONES_URL;

    @Value("${services.obras.url}")
    private String OBRAS_URL;

    private final WebClient.Builder webClientBuilder;

    // ✅ GET /bff/transacciones
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAllTransacciones() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> transaccionesFlux = client.get()
                .uri(TRANSACCIONES_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return transaccionesFlux.collectList().map(ResponseEntity::ok);
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

    // ✅ POST /bff/transacciones
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> createTransaccion(@RequestBody Map<String, Object> body) {
        WebClient client = webClientBuilder.build();

        return validarTotalContraPresupuesto(body)
                .then(client.post()
                        .uri(TRANSACCIONES_URL)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .map(ResponseEntity::ok));
    }

    // ✅ PUT /bff/transacciones/{id}
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> updateTransaccion(@PathVariable("id") Long id,
                                                                       @RequestBody Map<String, Object> body) {
        WebClient client = webClientBuilder.build();

        return validarTotalContraPresupuesto(body)
                .then(client.put()
                        .uri(TRANSACCIONES_URL + "/{id}", id)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .map(ResponseEntity::ok));
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

    @DeleteMapping("/costo/{idCosto}")
    public Mono<ResponseEntity<Void>> deleteTransaccionPorCosto(@PathVariable("idCosto") Long idCosto) {
        return webClientBuilder.build()
                .delete()
                .uri(TRANSACCIONES_URL + "/costo/{idCosto}", idCosto)
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

    private Mono<Void> validarTotalContraPresupuesto(Map<String, Object> body) {
        Object formaPago = body.get("forma_pago");
        if (formaPago == null || !"TOTAL".equalsIgnoreCase(formaPago.toString())) {
            return Mono.empty();
        }

        Object idObraObj = body.get("id_obra");
        if (idObraObj == null) {
            return Mono.error(new IllegalArgumentException("Debe indicar id_obra para validar forma de pago TOTAL."));
        }
        Long idObra;
        try {
            idObra = Long.valueOf(idObraObj.toString());
        } catch (NumberFormatException e) {
            return Mono.error(new IllegalArgumentException("id_obra inválido para validar forma de pago TOTAL."));
        }

        Object montoObj = body.get("monto");
        if (montoObj == null) {
            return Mono.error(new IllegalArgumentException("Debe indicar el monto cuando la forma de pago es TOTAL."));
        }

        BigDecimal monto;
        try {
            monto = new BigDecimal(montoObj.toString());
        } catch (NumberFormatException e) {
            return Mono.error(new IllegalArgumentException("Monto inválido para forma de pago TOTAL."));
        }

        WebClient client = webClientBuilder.build();
        // Si se está pagando un costo específico, validar contra ese costo
        Object idCostoObj = body.getOrDefault("id_costo", body.get("idCosto"));
        if (idCostoObj != null) {
            Long idCosto;
            try {
                idCosto = Long.valueOf(idCostoObj.toString());
            } catch (NumberFormatException e) {
                return Mono.error(new IllegalArgumentException("id_costo inválido para validar pago TOTAL."));
            }

            return client.get()
                    .uri(OBRAS_URL + "/costos/{idObra}", idObra)
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .collectList()
                    .flatMap(costos -> {
                        Map<String, Object> costo = costos.stream()
                                .filter(c -> idCosto.equals(parseLongSafe(c.get("id"))))
                                .findFirst()
                                .orElse(null);

                        if (costo == null) {
                            return Mono.error(new IllegalArgumentException("No se encontró el costo " + idCosto + " en la obra " + idObra));
                        }

                        BigDecimal totalCosto = parseBigDecimal(costo.get("total"));
                        if (totalCosto == null) {
                            return Mono.error(new IllegalArgumentException("El costo no tiene total para validar forma de pago TOTAL."));
                        }

                        if (totalCosto.compareTo(monto) != 0) {
                            return Mono.error(new IllegalArgumentException("El monto con forma de pago TOTAL debe ser igual al total del costo asociado."));
                        }
                        return Mono.empty();
                    });
        }

        // Caso general: validar contra presupuesto de la obra
        return client.get()
                .uri(OBRAS_URL + "/{id}", idObra)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .switchIfEmpty(Mono.error(new IllegalArgumentException("No se encontró la obra " + idObra)))
                .flatMap(obra -> {
                    BigDecimal presupuesto = parseBigDecimal(obra.get("presupuesto"));
                    if (presupuesto == null) {
                        return Mono.error(new IllegalArgumentException("La obra no tiene presupuesto para validar el pago TOTAL."));
                    }

                    if (presupuesto.compareTo(monto) != 0) {
                        return Mono.error(new IllegalArgumentException("El monto con forma de pago TOTAL debe ser igual al presupuesto total de la obra."));
                    }
                    return Mono.empty();
                });
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
