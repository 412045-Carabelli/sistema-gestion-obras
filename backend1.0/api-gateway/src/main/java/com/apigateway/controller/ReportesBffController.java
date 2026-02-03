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
import java.util.Map;
import java.util.Optional;

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
    public Mono<ResponseEntity<Object>> estadoFinanciero(@PathVariable("obraId") Long obraId) {
        return proxyGet("/financieros/estado-obra/" + obraId, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/flujo-caja")
    public Mono<ResponseEntity<Object>> flujoCaja(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/flujo-caja", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/dashboard")
    public Mono<ResponseEntity<Object>> dashboardFinanciero(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/dashboard", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/deudas-globales")
    public Mono<ResponseEntity<Object>> deudasGlobales(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/deudas-globales", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/cuenta-corriente-obra-global")
    public Mono<ResponseEntity<Object>> cuentaCorrienteObraGlobal(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/cuenta-corriente-obra-global", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/cuenta-corriente-proveedor-global")
    public Mono<ResponseEntity<Object>> cuentaCorrienteProveedorGlobal(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/cuenta-corriente-proveedor-global", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/cuenta-corriente-cliente")
    public Mono<ResponseEntity<Object>> cuentaCorrienteCliente(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/cuenta-corriente-cliente", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/pendientes")
    public Mono<ResponseEntity<Object>> pendientes(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/pendientes", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/cuenta-corriente-obra")
    public Mono<ResponseEntity<Object>> cuentaCorrienteObra(@RequestBody(required = false) Map<String, Object> filtro) {
        Long obraId = extractLong(filtro, "obraId");
        if (obraId == null) {
            return Mono.just(ResponseEntity.badRequest().body("obraId es requerido"));
        }
        return proxyGet("/cuenta-corriente/obra/" + obraId, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/cuenta-corriente-proveedor")
    public Mono<ResponseEntity<Object>> cuentaCorrienteProveedor(@RequestBody(required = false) Map<String, Object> filtro) {
        Long proveedorId = extractLong(filtro, "proveedorId");
        if (proveedorId == null) {
            return Mono.just(ResponseEntity.badRequest().body("proveedorId es requerido"));
        }
        return proxyGet("/cuenta-corriente/proveedor/" + proveedorId, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/cuenta-corriente-proveedores")
    public Mono<ResponseEntity<Object>> cuentaCorrienteProveedores(@RequestBody(required = false) Object filtro) {
        return proxyGet("/cuenta-corriente/proveedores", new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/comisiones")
    public Mono<ResponseEntity<Object>> comisiones(@RequestBody(required = false) Map<String, Object> filtro) {
        Long obraId = extractLong(filtro, "obraId");
        String path = obraId != null ? "/comisiones/obra/" + obraId : "/comisiones/general";
        return proxyGet(path, new ParameterizedTypeReference<>() {});
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
    public Mono<ResponseEntity<Object>> notasPorObra(@PathVariable("obraId") Long obraId) {
        return proxyGet("/obras/" + obraId + "/notas", new ParameterizedTypeReference<>() {});
    }

    // ---------- MÉTODOS UTILITARIOS ----------

    private <T> Mono<ResponseEntity<T>> proxyGet(String path, ParameterizedTypeReference<T> type) {
        return webClientBuilder.build()
                .get()
                .uri(reportesServiceUrl + path)
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
                .uri(reportesServiceUrl + path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body != null ? body : new Object())
                .retrieve()
                .bodyToMono(type)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body((T) ("Error al enviar datos: " + e.getMessage()))));
    }

    private Long extractLong(Map<String, Object> filtro, String key) {
        if (filtro == null) return null;
        return Optional.ofNullable(filtro.get(key))
                .map(val -> {
                    if (val instanceof Number n) return n.longValue();
                    try {
                        return Long.parseLong(val.toString());
                    } catch (NumberFormatException ex) {
                        return null;
                    }
                })
                .orElse(null);
    }
}
