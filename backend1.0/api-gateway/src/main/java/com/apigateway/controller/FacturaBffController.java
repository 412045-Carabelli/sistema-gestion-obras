package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/facturas")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class FacturaBffController {

    @Value("${services.facturas.url}")
    private String FACTURAS_URL;

    private final WebClient.Builder webClientBuilder;

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAll() {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getById(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    @GetMapping("/cliente/{idCliente}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getByCliente(@PathVariable("idCliente") Long idCliente) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/cliente/{idCliente}", idCliente)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    @GetMapping("/obra/{idObra}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getByObra(@PathVariable("idObra") Long idObra) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/obra/{idObra}", idObra)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> create(
            @RequestPart("id_cliente") String idCliente,
            @RequestPart("id_obra") String idObra,
            @RequestPart("monto") String monto,
            @RequestPart("monto_restante") String montoRestante,
            @RequestPart("fecha") String fecha,
            @RequestPart(value = "file", required = false) FilePart filePart
    ) {
        MultipartBodyBuilder builder = buildMultipart(idCliente, idObra, monto, montoRestante, fecha, filePart);
        return webClientBuilder.build()
                .post()
                .uri(FACTURAS_URL)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> update(
            @PathVariable("id") Long id,
            @RequestPart("id_cliente") String idCliente,
            @RequestPart("id_obra") String idObra,
            @RequestPart("monto") String monto,
            @RequestPart("monto_restante") String montoRestante,
            @RequestPart("fecha") String fecha,
            @RequestPart(value = "file", required = false) FilePart filePart
    ) {
        MultipartBodyBuilder builder = buildMultipart(idCliente, idObra, monto, montoRestante, fecha, filePart);
        return webClientBuilder.build()
                .put()
                .uri(FACTURAS_URL + "/{id}", id)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(FACTURAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }

    @GetMapping(value = "/{id}/download", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public Mono<ResponseEntity<Flux<DataBuffer>>> download(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/{id}/download", id)
                .exchangeToMono(response -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.putAll(response.headers().asHttpHeaders());
                    MediaType contentType = response.headers()
                            .contentType()
                            .orElse(MediaType.APPLICATION_OCTET_STREAM);
                    headers.setContentType(contentType);

                    return Mono.just(new ResponseEntity<>(
                            response.bodyToFlux(DataBuffer.class),
                            headers,
                            response.statusCode()
                    ));
                });
    }

    private MultipartBodyBuilder buildMultipart(
            String idCliente,
            String idObra,
            String monto,
            String montoRestante,
            String fecha,
            FilePart filePart
    ) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("id_cliente", idCliente);
        builder.part("id_obra", idObra);
        builder.part("monto", monto);
        builder.part("monto_restante", montoRestante);
        builder.part("fecha", fecha);

        if (filePart != null) {
            builder.part("file", filePart)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "form-data; name=file; filename=\"" + filePart.filename() + "\"")
                    .contentType(filePart.headers().getContentType());
        }

        return builder;
    }
}
