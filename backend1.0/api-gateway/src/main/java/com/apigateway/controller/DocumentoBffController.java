package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/documentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class DocumentoBffController {

    @Value("${services.documentos.url}")
    private String DOCUMENTOS_URL;

    private final WebClient.Builder webClientBuilder;

    // ================================
    // 📤 Crear documento (POST)
    // ================================
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> create(
            @RequestPart("id_obra") String idObra,
            @RequestPart("tipo_documento") String tipoDocumento,
            @RequestPart(value = "observacion", required = false) String observacion,
            @RequestPart(value = "id_asociado", required = false) String idAsociado,
            @RequestPart(value = "tipo_asociado", required = false) String tipoAsociado,
            @RequestPart("file") FilePart filePart
    ) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("id_obra", idObra);
        builder.part("tipo_documento", tipoDocumento);
        if (observacion != null && !observacion.isEmpty()) {
            builder.part("observacion", observacion);
        }
        if (idAsociado != null && !idAsociado.isEmpty()) {
            builder.part("id_asociado", idAsociado);
        }
        if (tipoAsociado != null && !tipoAsociado.isEmpty()) {
            builder.part("tipo_asociado", tipoAsociado);
        }

        // Adjuntar archivo preservando filename y content type
        builder.part("file", filePart)
                .header(HttpHeaders.CONTENT_DISPOSITION, "form-data; name=file; filename=\"" + filePart.filename() + "\"")
                .contentType(filePart.headers().getContentType());

        return webClientBuilder.build()
                .post()
                .uri(DOCUMENTOS_URL)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    Map<String, Object> err = Map.of(
                            "error", "No se pudo crear el documento",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(err));
                });
    }

    // ================================
    // 📥 Obtener documentos por obra (GET)
    // ================================
    @GetMapping("/obra/{idObra}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getDocumentosPorObra(
            @PathVariable("idObra") Long idObra) {
        return webClientBuilder.build()
                .get()
                .uri(DOCUMENTOS_URL + "/obra/{idObra}", idObra)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    return Mono.just(ResponseEntity.internalServerError().body(List.of()));
                });
    }

    // ================================
    // 🗑️ Eliminar documento (DELETE)
    // ================================
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteDocumento(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(DOCUMENTOS_URL + "/{id}", id)
                .retrieve()
                .toBodilessEntity()
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    @GetMapping("/{id}/download")
    public Mono<Void> downloadDocumento(@PathVariable("id") Long id, ServerHttpResponse response) {
        return webClientBuilder.build()
                .get()
                .uri(DOCUMENTOS_URL + "/{id}/download", id)
                .exchangeToMono(clientResponse -> {
                    response.setStatusCode(clientResponse.statusCode());
                    response.getHeaders().putAll(clientResponse.headers().asHttpHeaders());
                    return response.writeWith(clientResponse.bodyToFlux(org.springframework.core.io.buffer.DataBuffer.class));
                })
                .onErrorResume(ex -> {
                    response.setStatusCode(org.springframework.http.HttpStatus.NOT_FOUND);
                    return response.setComplete();
                });
    }

    @GetMapping("/asociado/{tipo}/{id}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getDocumentosPorAsociado(
            @PathVariable("tipo") String tipo,
            @PathVariable("id") Long id) {

        return webClientBuilder.build()
                .get()
                .uri(DOCUMENTOS_URL + "/asociado/{tipo}/{id}", tipo, id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    return Mono.just(ResponseEntity.internalServerError().body(List.of()));
                });
    }
}
