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

import java.net.URI;
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
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAll(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long idCliente,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return webClientBuilder.build()
                .get()
                .uri(uriBuilder -> {
                    URI base = URI.create(FACTURAS_URL);
                    var builder = uriBuilder
                            .scheme(base.getScheme())
                            .host(base.getHost());
                    if (base.getPort() != -1) {
                        builder.port(base.getPort());
                    }
                    if (base.getPath() != null && !base.getPath().isEmpty()) {
                        builder.path(base.getPath());
                    }
                    if (estado != null && !estado.isEmpty()) {
                        builder.queryParam("estado", estado);
                    }
                    if (idCliente != null) {
                        builder.queryParam("idCliente", idCliente);
                    }
                    if (page != null) {
                        builder.queryParam("page", page);
                    }
                    if (size != null) {
                        builder.queryParam("size", size);
                    }
                    return builder.build();
                })
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
            @RequestPart(value = "id_obra", required = false) String idObra,
            @RequestPart("monto") String monto,
            @RequestPart(value = "monto_restante", required = false) String montoRestante,
            @RequestPart("fecha") String fecha,
            @RequestPart(value = "descripcion", required = false) String descripcion,
            @RequestPart(value = "estado", required = false) String estado,
            @RequestPart(value = "impacta_cta_cte", required = false) String impactaCtaCte,
            @RequestPart(value = "file", required = false) FilePart filePart
    ) {
        MultipartBodyBuilder builder = buildMultipart(idCliente, idObra, monto, montoRestante, fecha, descripcion, estado, impactaCtaCte, filePart);
        return webClientBuilder.build()
                .post()
                .uri(FACTURAS_URL)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .exchangeToMono(response -> response
                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .map(body -> ResponseEntity.status(response.statusCode()).body(body)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> update(
            @PathVariable("id") Long id,
            @RequestPart("id_cliente") String idCliente,
            @RequestPart(value = "id_obra", required = false) String idObra,
            @RequestPart("monto") String monto,
            @RequestPart(value = "monto_restante", required = false) String montoRestante,
            @RequestPart("fecha") String fecha,
            @RequestPart(value = "descripcion", required = false) String descripcion,
            @RequestPart(value = "estado", required = false) String estado,
            @RequestPart(value = "impacta_cta_cte", required = false) String impactaCtaCte,
            @RequestPart(value = "file", required = false) FilePart filePart
    ) {
        MultipartBodyBuilder builder = buildMultipart(idCliente, idObra, monto, montoRestante, fecha, descripcion, estado, impactaCtaCte, filePart);
        return webClientBuilder.build()
                .put()
                .uri(FACTURAS_URL + "/{id}", id)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .exchangeToMono(response -> response
                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .map(body -> ResponseEntity.status(response.statusCode()).body(body)));
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
    public Mono<Void> download(@PathVariable("id") Long id, ServerHttpResponse response) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/{id}/download", id)
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

    private MultipartBodyBuilder buildMultipart(
            String idCliente,
            String idObra,
            String monto,
            String montoRestante,
            String fecha,
            String descripcion,
            String estado,
            String impactaCtaCte,
            FilePart filePart
    ) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("id_cliente", idCliente);
        if (idObra != null && !idObra.isBlank()) {
            builder.part("id_obra", idObra);
        }
        builder.part("monto", monto);
        if (montoRestante != null && !montoRestante.isBlank()) {
            builder.part("monto_restante", montoRestante);
        }
        builder.part("fecha", fecha);
        if (descripcion != null) {
            builder.part("descripcion", descripcion);
        }
        if (estado != null) {
            builder.part("estado", estado);
        }
        if (impactaCtaCte != null) {
            builder.part("impacta_cta_cte", impactaCtaCte);
        }

        if (filePart != null) {
            builder.part("file", filePart)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "form-data; name=file; filename=\"" + filePart.filename() + "\"")
                    .contentType(filePart.headers().getContentType());
        }

        return builder;
    }
}
