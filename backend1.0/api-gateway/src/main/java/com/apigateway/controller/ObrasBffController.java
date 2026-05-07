package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/bff/obras")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ObrasBffController {

  private final WebClient.Builder webClientBuilder;

  @Value("${services.obras.url}")
  private String obrasServiceUrl;

  // ---------- GRUPOS DE OBRAS ----------

  @PostMapping("/grupos")
  public Mono<ResponseEntity<Object>> crearGrupo(@RequestBody Object dto) {
    return proxyPost("/api/grupos-obras", dto, new ParameterizedTypeReference<>() {});
  }

  @GetMapping("/grupos")
  public Mono<ResponseEntity<Object>> listarGrupos() {
    return proxyGet("/api/grupos-obras", new ParameterizedTypeReference<>() {});
  }

  @GetMapping("/grupos/{id}")
  public Mono<ResponseEntity<Object>> obtenerGrupo(@PathVariable Long id) {
    return proxyGet("/api/grupos-obras/" + id, new ParameterizedTypeReference<>() {});
  }

  @GetMapping("/grupos/cliente/{idCliente}")
  public Mono<ResponseEntity<Object>> listarGruposPorCliente(@PathVariable Long idCliente) {
    return proxyGet("/api/grupos-obras/cliente/" + idCliente, new ParameterizedTypeReference<>() {});
  }

  @GetMapping("/grupos/cliente/{idCliente}/activos")
  public Mono<ResponseEntity<Object>> listarGruposActivosPorCliente(@PathVariable Long idCliente) {
    return proxyGet("/api/grupos-obras/cliente/" + idCliente + "/activos", new ParameterizedTypeReference<>() {});
  }

  @PutMapping("/grupos/{id}")
  public Mono<ResponseEntity<Object>> actualizarGrupo(@PathVariable Long id, @RequestBody Object dto) {
    return proxyPut("/api/grupos-obras/" + id, dto, new ParameterizedTypeReference<>() {});
  }

  @DeleteMapping("/grupos/{id}")
  public Mono<ResponseEntity<Void>> eliminarGrupo(@PathVariable Long id) {
    return webClientBuilder.build()
        .delete()
        .uri(obrasServiceUrl + "/api/grupos-obras/" + id)
        .retrieve()
        .bodyToMono(Void.class)
        .map(ResponseEntity::ok)
        .onErrorResume(e -> Mono.just(ResponseEntity.noContent().build()));
  }

  // ---------- SALDOS POR GRUPOS ----------

  @GetMapping("/saldos-grupos/clientes")
  public Mono<ResponseEntity<Object>> obtenerSaldosGruposClientes() {
    return proxyGet("/api/saldos-grupos/clientes", new ParameterizedTypeReference<>() {});
  }

  @GetMapping("/saldos-grupos/proveedores")
  public Mono<ResponseEntity<Object>> obtenerSaldosGruposProveedores() {
    return proxyGet("/api/saldos-grupos/proveedores", new ParameterizedTypeReference<>() {});
  }

  @GetMapping("/saldos-grupos/resumen-obras/clientes")
  public Mono<ResponseEntity<Object>> obtenerResumenObrasClientes() {
    return proxyGet("/api/saldos-grupos/resumen-obras/clientes", new ParameterizedTypeReference<>() {});
  }

  @GetMapping("/saldos-grupos/resumen-obras/proveedores")
  public Mono<ResponseEntity<Object>> obtenerResumenObrasProveedores() {
    return proxyGet("/api/saldos-grupos/resumen-obras/proveedores", new ParameterizedTypeReference<>() {});
  }

  // ---------- MÉTODOS UTILITARIOS ----------

  @SuppressWarnings("unchecked")
  private <T> Mono<ResponseEntity<T>> proxyGet(String path, ParameterizedTypeReference<T> type) {
    return webClientBuilder.build()
        .get()
        .uri(obrasServiceUrl + path)
        .accept(MediaType.APPLICATION_JSON)
        .retrieve()
        .bodyToMono(type)
        .map(ResponseEntity::ok)
        .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
            .body((T) ("Error: " + e.getMessage()))));
  }

  @SuppressWarnings("unchecked")
  private <T> Mono<ResponseEntity<T>> proxyPost(String path, Object body, ParameterizedTypeReference<T> type) {
    return webClientBuilder.build()
        .post()
        .uri(obrasServiceUrl + path)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .retrieve()
        .bodyToMono(type)
        .map(ResponseEntity::ok)
        .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
            .body((T) ("Error: " + e.getMessage()))));
  }

  @SuppressWarnings("unchecked")
  private <T> Mono<ResponseEntity<T>> proxyPut(String path, Object body, ParameterizedTypeReference<T> type) {
    return webClientBuilder.build()
        .put()
        .uri(obrasServiceUrl + path)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .retrieve()
        .bodyToMono(type)
        .map(ResponseEntity::ok)
        .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
            .body((T) ("Error: " + e.getMessage()))));
  }
}
