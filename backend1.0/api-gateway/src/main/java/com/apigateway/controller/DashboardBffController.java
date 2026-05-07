package com.apigateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * BFF Controller para dashboard - proxea hacia transacciones-service.
 * Rutas: /bff/dashboard/* (DEPRECATED - usar /bff/obras/resumen-obras)
 */
@RestController
@RequestMapping("/bff/dashboard")
public class DashboardBffController {

  @Value("${services.transacciones.url}")
  private String transaccionesServiceUrl;

  // DEPRECATED: Este endpoint no es usado. Usar /bff/obras/resumen-obras en su lugar
  /*
  @PostMapping("/cuenta-corriente")
  public Mono<ResponseEntity<Map<String, Object>>> obtenerCuentaCorriente(
      @RequestBody(required = false) Map<String, Object> body) {
    WebClient client = webClientBuilder.build();
    return client.post()
        .uri(transaccionesServiceUrl + "/dashboard/cuenta-corriente")
        .bodyValue(body != null ? body : Map.of())
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
        .map(ResponseEntity::ok)
        .doOnError(error -> error.printStackTrace());
  }
  */
}
