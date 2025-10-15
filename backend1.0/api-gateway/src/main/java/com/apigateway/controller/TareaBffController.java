package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/tareas")
@RequiredArgsConstructor
public class TareaBffController {

    private final WebClient.Builder webClientBuilder;
    private final String TAREAS_URL = "http://localhost:8081/api/obras/tareas";

    // ✅ Tareas por obra
    @GetMapping("/{idObra}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTareasPorObra(@PathVariable("idObra") Long idObra) {
        return webClientBuilder.build()
                .get()
                .uri(TAREAS_URL + "/{idObra}", idObra)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    // 🆕 ✅ Tareas por proveedor
    @GetMapping("/proveedor/{idProveedor}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTareasPorProveedor(@PathVariable("idProveedor") Long idProveedor) {
        return webClientBuilder.build()
                .get()
                .uri(TAREAS_URL + "/proveedor/{idProveedor}", idProveedor)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ✅ POST Crear tarea
    @PostMapping("/{idObra}")
    public Mono<ResponseEntity<Map<String, Object>>> crearTarea(
            @PathVariable("idObra") Long idObra,
            @RequestBody Map<String, Object> tareaDTO) {

        return webClientBuilder.build()
                .post()
                .uri(TAREAS_URL + "/{idObra}", idObra)
                .bodyValue(tareaDTO)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ PUT completar
    @PutMapping("/{id}/completar")
    public Mono<ResponseEntity<Map<String, Object>>> completarTarea(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .put()
                .uri(TAREAS_URL + "/{id}/completar", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ DELETE borrar
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> borrarTarea(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(TAREAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .map(ResponseEntity::ok);
    }
}
