package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/notificaciones")
@RequiredArgsConstructor
public class NotificacionesBffController {

    @Value("${services.obras.tareas.url}")
    private String obrasTareasUrl;

    @Value("${services.agendas.tareas.url}")
    private String agendasTareasUrl;

    private final WebClient.Builder webClientBuilder;

    /**
     * Retorna tareas próximas a vencer de obras-service y agendas-service combinadas.
     * @param dias ventana en días (default 7)
     */
    @GetMapping("/proximas")
    public Mono<ResponseEntity<Map<String, Object>>> tareasProximas(
            @RequestParam(name = "dias", defaultValue = "7") int dias) {

        Mono<List<Map<String, Object>>> tareasObras = webClientBuilder.build()
                .get()
                .uri(obrasTareasUrl + "/proximas?dias=" + dias)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorReturn(List.of());

        Mono<List<Map<String, Object>>> tareasAgendas = webClientBuilder.build()
                .get()
                .uri(agendasTareasUrl + "/proximas?dias=" + dias)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorReturn(List.of());

        return Mono.zip(tareasObras, tareasAgendas)
                .map(tuple -> {
                    Map<String, Object> resultado = new HashMap<>();
                    resultado.put("tareasObras", tuple.getT1());
                    resultado.put("tareasAgendas", tuple.getT2());
                    resultado.put("dias", dias);
                    return ResponseEntity.ok(resultado);
                });
    }
}
