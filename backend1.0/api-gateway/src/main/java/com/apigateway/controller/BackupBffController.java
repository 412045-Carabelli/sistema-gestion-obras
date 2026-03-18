package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/v1/backups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BackupBffController {

    @Value("${services.backups.url}")
    private String backupsUrl;

    private final WebClient.Builder webClientBuilder;

    @GetMapping("/summary")
    public Mono<ResponseEntity<Map<String, Object>>> summary() {
        return proxyGet("/summary", new ParameterizedTypeReference<>() {});
    }

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> list() {
        return proxyGet("", new ParameterizedTypeReference<>() {});
    }

    @GetMapping("/schedule")
    public Mono<ResponseEntity<Map<String, Object>>> getSchedule() {
        return proxyGet("/schedule", new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/manual")
    public Mono<ResponseEntity<Map<String, Object>>> createManual(@RequestBody Map<String, Object> payload) {
        return proxyPost("/manual", payload, new ParameterizedTypeReference<>() {});
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> importBackup(
            @RequestPart("file") FilePart file,
            @RequestPart(value = "requestedBy", required = false) String requestedBy,
            @RequestPart(value = "comment", required = false) String comment
    ) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file);
        if (requestedBy != null && !requestedBy.isBlank()) {
            builder.part("requestedBy", requestedBy);
        }
        if (comment != null && !comment.isBlank()) {
            builder.part("comment", comment);
        }

        return webClientBuilder.build()
                .post()
                .uri(backupsUrl + "/import")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    @GetMapping("/{id}/download")
    public Mono<Void> download(@PathVariable("id") Long id, ServerHttpResponse response) {
        return webClientBuilder.build()
                .get()
                .uri(backupsUrl + "/" + id + "/download")
                .exchangeToMono(clientResponse -> {
                    response.setStatusCode(clientResponse.statusCode());
                    response.getHeaders().putAll(clientResponse.headers().asHttpHeaders());
                    response.getHeaders().set(HttpHeaders.CONTENT_DISPOSITION, clientResponse.headers().asHttpHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
                    return response.writeWith(clientResponse.bodyToFlux(DataBuffer.class));
                });
    }

    @PostMapping("/{id}/restore")
    public Mono<ResponseEntity<Map<String, Object>>> restore(@PathVariable("id") Long id) {
        return proxyPost("/" + id + "/restore", Map.of(), new ParameterizedTypeReference<>() {});
    }

    @PutMapping("/schedule")
    public Mono<ResponseEntity<Map<String, Object>>> updateSchedule(@RequestBody Map<String, Object> payload) {
        return proxyPut("/schedule", payload, new ParameterizedTypeReference<>() {});
    }

    private <T> Mono<ResponseEntity<T>> proxyGet(String path, ParameterizedTypeReference<T> type) {
        return webClientBuilder.build()
                .get()
                .uri(backupsUrl + path)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(type)
                .map(ResponseEntity::ok);
    }

    private <T> Mono<ResponseEntity<T>> proxyPost(String path, Object body, ParameterizedTypeReference<T> type) {
        return webClientBuilder.build()
                .post()
                .uri(backupsUrl + path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(type)
                .map(ResponseEntity::ok);
    }

    private <T> Mono<ResponseEntity<T>> proxyPut(String path, Object body, ParameterizedTypeReference<T> type) {
        return webClientBuilder.build()
                .put()
                .uri(backupsUrl + path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(type)
                .map(ResponseEntity::ok);
    }
}
