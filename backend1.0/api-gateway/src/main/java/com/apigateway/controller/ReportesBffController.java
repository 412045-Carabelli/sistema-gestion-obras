package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/bff/reportes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportesBffController {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.reportes.url}")
    private String reportesServiceUrl;

    // ---------- FINANCIEROS ----------

    @PostMapping("/financieros/ingresos-egresos")
    public Mono<ResponseEntity<Object>> ingresosEgresos(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/ingresos-egresos", filtro, new ParameterizedTypeReference<>() {});
    }

    @GetMapping("/financieros/estado-obra/{obraId}")
    public Mono<ResponseEntity<Object>> estadoFinanciero(@PathVariable Long obraId) {
        return proxyGet("/financieros/estado-obra/" + obraId, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/flujo-caja")
    public Mono<ResponseEntity<Object>> flujoCaja(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/flujo-caja", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/pendientes")
    public Mono<ResponseEntity<Object>> pendientes(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/pendientes", filtro, new ParameterizedTypeReference<>() {});
    }

    // ---------- OPERATIVOS ----------

    @PostMapping("/operativos/estado-obras")
    public Mono<ResponseEntity<Object>> estadoObras(@RequestBody(required = false) Object filtro) {
        return proxyPost("/operativos/estado-obras", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/operativos/avance-tareas")
    public Mono<ResponseEntity<Object>> avanceTareas(@RequestBody(required = false) Object filtro) {
        return proxyPost("/operativos/avance-tareas", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/operativos/costos-categoria")
    public Mono<ResponseEntity<Object>> costosPorCategoria(@RequestBody(required = false) Object filtro) {
        return proxyPost("/operativos/costos-categoria", filtro, new ParameterizedTypeReference<>() {});
    }

    // ---------- GENERALES ----------

    @GetMapping("/generales/resumen")
    public Mono<ResponseEntity<Object>> resumenGeneral() {
        return proxyGet("/generales/resumen", new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/generales/ranking-clientes")
    public Mono<ResponseEntity<Object>> rankingClientes(@RequestBody(required = false) Object filtro) {
        return proxyPost("/generales/ranking-clientes", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/generales/ranking-proveedores")
    public Mono<ResponseEntity<Object>> rankingProveedores(@RequestBody(required = false) Object filtro) {
        return proxyPost("/generales/ranking-proveedores", filtro, new ParameterizedTypeReference<>() {});
    }

    // ---------- NOTAS ----------

    @GetMapping("/obras/notas")
    public Mono<ResponseEntity<List<Object>>> notasGenerales() {
        return proxyGet("/obras/notas", new ParameterizedTypeReference<List<Object>>() {});
    }

    @GetMapping("/obras/{obraId}/notas")
    public Mono<ResponseEntity<Object>> notasPorObra(@PathVariable Long obraId) {
        return proxyGet("/obras/" + obraId + "/notas", new ParameterizedTypeReference<>() {});
    }

    // ---------- MÉTODOS UTILITARIOS ----------

    private <T> Mono<ResponseEntity<T>> proxyGet(String path, ParameterizedTypeReference<T> type) {
        return webClientBuilder.build()
                .get()
                .uri(reportesServiceUrl + "/api/reportes" + path)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(type)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body((T) ("Error al obtener datos: " + e.getMessage()))));
    }

    private <T> Mono<ResponseEntity<T>> proxyPost(String path, Object body, ParameterizedTypeReference<T> type) {
        return webClientBuilder.build()
                .post()
                .uri(reportesServiceUrl + "/api/reportes" + path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body != null ? body : new Object())
                .retrieve()
                .bodyToMono(type)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body((T) ("Error al enviar datos: " + e.getMessage()))));
    }
}
