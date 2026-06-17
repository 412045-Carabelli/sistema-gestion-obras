package com.apigateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * BFF Controller para dashboard - proxea hacia transacciones-service.
 */
@RestController
@RequestMapping("/bff/dashboard")
@CrossOrigin(origins = "*")
public class DashboardBffController {

  @Value("${services.transacciones.url}")
  private String transaccionesServiceUrl;

  private final WebClient.Builder webClientBuilder;

  public DashboardBffController(WebClient.Builder webClientBuilder) {
    this.webClientBuilder = webClientBuilder;
  }

  @PostMapping("/cuenta-corriente")
  public Mono<ResponseEntity<Map<String, Object>>> obtenerCuentaCorriente(
      @RequestBody(required = false) Map<String, Object> body) {
    return webClientBuilder.build()
        .post()
        .uri(transaccionesServiceUrl + "/dashboard/cuenta-corriente")
        .bodyValue(body != null ? body : Map.of())
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
        .map(ResponseEntity::ok)
        .onErrorResume(e -> {
          e.printStackTrace();
          return Mono.just(ResponseEntity.internalServerError().build());
        });
  }
}
