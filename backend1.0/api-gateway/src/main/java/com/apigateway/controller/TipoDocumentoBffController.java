package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/tipo-documentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class TipoDocumentoBffController {

    @Value("${services.documentos.url}/tipo-documentos")
    private String TIPO_DOC_URL;

    private final WebClient.Builder webClientBuilder;

    // ✅ GET /bff/tipo_documentos
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAll() {
        WebClient client = webClientBuilder.build();
        Flux<Map<String, Object>> flux = client.get()
                .uri(TIPO_DOC_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});
        return flux.collectList().map(ResponseEntity::ok);
    }

    // ✅ GET /bff/tipo_documentos/{id}
    @GetMapping("/{tipo}")
    public Mono<ResponseEntity<Map<String, Object>>> getByTipo(@PathVariable("tipo") String tipo) {
        WebClient client = webClientBuilder.build();
        return client.get()
                .uri(TIPO_DOC_URL + "/{tipo}", tipo)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.notFound().build()));
    }

    // ✅ POST /bff/tipo_documentos
    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> create(@RequestBody Map<String, Object> body) {
        WebClient client = webClientBuilder.build();
        return client.post()
                .uri(TIPO_DOC_URL)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ PUT /bff/tipo_documentos/{id}
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> update(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        WebClient client = webClientBuilder.build();
        return client.put()
                .uri(TIPO_DOC_URL + "/{id}", id)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    // ✅ DELETE /bff/tipo_documentos/{id}
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();
        return client.delete()
                .uri(TIPO_DOC_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }
}
