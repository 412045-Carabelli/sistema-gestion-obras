package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/agendas")
@RequiredArgsConstructor
public class AgendasBffController {

    @Value("${services.agendas.url}")
    private String AGENDAS_URL;

    private final WebClient.Builder webClientBuilder;

    // ✅ Listar todas las agendas
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> obtenerTodasLasAgendas() {
        return webClientBuilder.build()
                .get()
                .uri(AGENDAS_URL + "/api/tareas")
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ✅ Obtener una agenda por ID
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> obtenerAgendaPorId(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .get()
                .uri(AGENDAS_URL + "/api/tareas/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ Crear agenda
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> crearAgenda(@RequestBody Map<String, Object> agendaDTO) {
        return webClientBuilder.build()
                .post()
                .uri(AGENDAS_URL + "/api/tareas")
                .bodyValue(agendaDTO)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ Actualizar agenda
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> actualizarAgenda(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> agendaDTO) {

        return webClientBuilder.build()
                .put()
                .uri(AGENDAS_URL + "/api/tareas/{id}", id)
                .bodyValue(agendaDTO)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ Cambiar estado de agenda
    @PatchMapping("/{id}/estado")
    public Mono<ResponseEntity<Map<String, Object>>> cambiarEstadoAgenda(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> request) {

        return webClientBuilder.build()
                .patch()
                .uri(AGENDAS_URL + "/api/tareas/{id}/estado", id)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ Eliminar agenda
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> eliminarAgenda(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(AGENDAS_URL + "/api/tareas/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .map(ResponseEntity::ok);
    }
}
