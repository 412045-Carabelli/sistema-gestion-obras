package com.apigateway.controller;

import com.common.dto.tareas.TareaAntiguaAgendaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/agendas")
@RequiredArgsConstructor
public class AgendaBffController {

    @Value("${services.agendas.tareas.url}")
    private String AGENDA_TAREAS_URL;

    private final WebClient.Builder webClientBuilder;

    // ✅ Listar todas las tareas de agendas
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTareasAgendas() {
        return webClientBuilder.build()
                .get()
                .uri(AGENDA_TAREAS_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ✅ Tareas antiguas de la agenda (enriquecidas con nombres) - DEBE IR ANTES DE /{idObra}
    @GetMapping("/antiguas")
    public Mono<ResponseEntity<List<TareaAntiguaAgendaResponse>>> getTareasAntiguasAgenda(
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        String uri = UriComponentsBuilder.fromUriString(AGENDA_TAREAS_URL + "/antiguas")
                .queryParam("limit", limit)
                .toUriString();

        return webClientBuilder.build()
                .get()
                .uri(uri)
                .retrieve()
                .bodyToFlux(TareaAntiguaAgendaResponse.class)
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ✅ Tareas por proveedor - DEBE IR ANTES DE /{idObra}
    @GetMapping("/proveedor/{idProveedor}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTareasPorProveedor(@PathVariable("idProveedor") Long idProveedor) {
        return webClientBuilder.build()
                .get()
                .uri(AGENDA_TAREAS_URL + "/proveedor/{idProveedor}", idProveedor)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ✅ Tareas por obra - DEBE IR AL FINAL (es el más genérico)
    @GetMapping("/{idObra}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTareasPorObra(
            @PathVariable("idObra") Long idObra,
            @RequestParam(name = "soloActivas", defaultValue = "false") boolean soloActivas,
            @RequestParam(name = "ordenAntiguas", defaultValue = "false") boolean ordenAntiguas
    ) {
        String uri = UriComponentsBuilder.fromUriString(AGENDA_TAREAS_URL + "/" + idObra)
                .queryParamIfPresent("soloActivas", soloActivas ? java.util.Optional.of(true) : java.util.Optional.empty())
                .queryParamIfPresent("ordenAntiguas", ordenAntiguas ? java.util.Optional.of(true) : java.util.Optional.empty())
                .toUriString();

        return webClientBuilder.build()
                .get()
                .uri(uri)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    // ✅ POST Crear tarea (sin idObra)
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> crearTarea(
            @RequestBody Map<String, Object> tareaDTO) {

        return webClientBuilder.build()
                .post()
                .uri(AGENDA_TAREAS_URL)
                .bodyValue(tareaDTO)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ POST Crear tarea (con idObra) - DEBE IR AL FINAL (es más genérico)
    @PostMapping("/{idObra}")
    public Mono<ResponseEntity<Map<String, Object>>> crearTareaConObra(
            @PathVariable("idObra") Long idObra,
            @RequestBody Map<String, Object> tareaDTO) {

        return webClientBuilder.build()
                .post()
                .uri(AGENDA_TAREAS_URL + "/{idObra}", idObra)
                .bodyValue(tareaDTO)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ PUT completar - DEBE IR ANTES DE /{id}
    @PutMapping("/{id}/completar")
    public Mono<ResponseEntity<Map<String, Object>>> completarTarea(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .put()
                .uri(AGENDA_TAREAS_URL + "/{id}/completar", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ PUT actualizar - DEBE IR DESPUÉS DE COMPLETAR
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> actualizarTarea(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> tareaDTO) {

        return webClientBuilder.build()
                .put()
                .uri(AGENDA_TAREAS_URL + "/{id}", id)
                .bodyValue(tareaDTO)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ PATCH cambiar estado - DEBE IR ANTES DE /{id}
    @PatchMapping("/{id}/estado")
    public Mono<ResponseEntity<Map<String, Object>>> cambiarEstado(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> request) {
        return webClientBuilder.build()
                .patch()
                .uri(AGENDA_TAREAS_URL + "/{id}/estado", id)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ DELETE borrar
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> borrarTarea(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(AGENDA_TAREAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .map(ResponseEntity::ok);
    }
}
