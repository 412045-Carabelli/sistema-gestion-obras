package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
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
    public Mono<ResponseEntity<String>> create(
            @RequestPart("id_obra") String idObra,
            @RequestPart("id_tipo_documento") String idTipoDocumento,
            @RequestPart(value = "observacion", required = false) String observacion,
            @RequestPart("file") FilePart filePart
    ) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("id_obra", idObra);
        builder.part("id_tipo_documento", idTipoDocumento);
        builder.part("observacion", observacion != null ? observacion : "");

        builder.asyncPart("file", filePart.content(), DataBuffer.class)
                .filename(filePart.filename())
                .header("Content-Disposition",
                        "form-data; name=\"file\"; filename=\"" + filePart.filename() + "\"");

        return webClientBuilder.build()
                .post()
                .uri(DOCUMENTOS_URL)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .map(ResponseEntity::ok);
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
                .map(ResponseEntity::ok);
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
                .toBodilessEntity();
    }

    @GetMapping("/{id}/download")
    public Mono<ResponseEntity<byte[]>> downloadDocumento(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .get()
                .uri(DOCUMENTOS_URL + "/{id}/download", id)
                .retrieve()
                .toEntity(byte[].class);
    }

}
