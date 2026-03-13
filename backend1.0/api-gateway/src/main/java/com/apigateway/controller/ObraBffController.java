package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/bff/v1/obras")
@RequiredArgsConstructor
public class ObraBffController {

    @Value("${services.obras.url}")
    private String OBRAS_URL;

    @Value("${services.clientes.url}")
    private String CLIENTES_URL;

    @Value("${services.obras.url}/costos")
    private String COSTOS_URL;

    @Value("${services.obras.url}/tareas")
    private String TAREAS_URL;

    @Value("${services.proveedores.url}")
    private String PROVEEDORES_URL;

    @Value("${services.transacciones.url}")
    private String TRANSACCIONES_URL;

    private final WebClient.Builder webClientBuilder;

    // ================================
    // ðŸ“¥ POST - Crear Obra
    // ================================
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> crearObra(@RequestBody Map<String, Object> obraDto) {
        WebClient client = webClientBuilder.build();

        return client.post()
                .uri(OBRAS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(obraDto)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    Map<String, Object> err = Map.of(
                            "error", "No se pudo crear la obra",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(err));
                });
    }

    // ================================
    // âœï¸ PUT - Actualizar Obra
    // ================================
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> actualizarObra(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> obraDto
    ) {
        WebClient client = webClientBuilder.build();

        return client.put()
                .uri(OBRAS_URL + "/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(obraDto)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    Map<String, Object> err = Map.of(
                            "error", "No se pudo actualizar la obra",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(err));
                });
    }

    // ================================
// ðŸŒ€ PATCH - Cambiar estado de la Obra
// ================================
    @PatchMapping("/{id}/estado/{estado}")
    public Mono<ResponseEntity<Object>> cambiarEstadoObra(
            @PathVariable("id") Long idObra,
            @PathVariable("estado") String estado
    ) {
        WebClient client = webClientBuilder.build();

        return client.patch()
                .uri(OBRAS_URL + "/{id}/estado/{estado}", idObra, estado)
                .retrieve()
                .toBodilessEntity()
                .map(response -> ResponseEntity.noContent().build())
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    @PatchMapping("/{id}/activo")
    public Mono<ResponseEntity<Object>> actualizarActivo(
            @PathVariable("id") Long id
    ) {
        WebClient client = webClientBuilder.build();

        Mono<Map<String, Object>> obraMono = client.get()
                .uri(OBRAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(ex -> Mono.just(Map.of()));

        return obraMono.flatMap(obra -> {
            boolean conoceActivo = obra.containsKey("activo");
            boolean activoActual = !conoceActivo || Boolean.TRUE.equals(obra.get("activo"));
            return client.patch()
                    .uri(OBRAS_URL + "/{id}/activo", id)
                    .retrieve()
                    .toBodilessEntity()
                    .flatMap(response -> {
                        if (!activoActual) {
                            return client.patch()
                                    .uri(TRANSACCIONES_URL + "/obra/{obraId}/activar", id)
                                    .retrieve()
                                    .toBodilessEntity()
                                    .map(r -> ResponseEntity.noContent().build());
                        }
                        return client.patch()
                                .uri(TRANSACCIONES_URL + "/obra/{obraId}/inactivar", id)
                                .retrieve()
                                .toBodilessEntity()
                                .map(r -> ResponseEntity.noContent().build());
                    });
        }).onErrorResume(ex -> {
            ex.printStackTrace();
            return Mono.just(ResponseEntity.internalServerError().build());
        });
    }


    // ================================
    // ðŸ“œ GET - Listar Obras (resumido)
    // ================================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTodasLasObras(
            @RequestParam Map<String, String> queryParams
    ) {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> obrasFlux = client.get()
                .uri(uriBuilder -> {
                    URI base = URI.create(OBRAS_URL);
                    var builder = uriBuilder
                            .scheme(base.getScheme())
                            .host(base.getHost());
                    if (base.getPort() != -1) {
                        builder.port(base.getPort());
                    }
                    if (base.getPath() != null && !base.getPath().isEmpty()) {
                        builder.path(base.getPath());
                    }
                    if (queryParams != null && !queryParams.isEmpty()) {
                        queryParams.forEach(builder::queryParam);
                    }
                    return builder.build();
                })
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        return obrasFlux.collectList()
                .flatMap(obras -> {
                    if (obras.isEmpty()) {
                        return Mono.just(ResponseEntity.ok(List.<Map<String, Object>>of()));
                    }
                    List<Long> ids = obras.stream()
                            .map(obra -> obra.get("id_cliente"))
                            .filter(id -> id instanceof Number)
                            .map(id -> ((Number) id).longValue())
                            .distinct()
                            .toList();

                    return fetchClientesByIds(client, ids)
                            .map(clientesMap -> {
                                obras.forEach(obra -> {
                                    Object idClienteObj = obra.get("id_cliente");
                                    if (idClienteObj instanceof Number num) {
                                        Map<String, Object> cliente = clientesMap.get(num.longValue());
                                        obra.put("cliente", (cliente == null || cliente.isEmpty()) ? null : cliente);
                                    } else {
                                        obra.put("cliente", null);
                                    }
                                    obra.remove("id_cliente");
                                });
                                return ResponseEntity.ok(obras);
                            });
                })
                .onErrorResume(ex -> {
                    Map<String, Object> err = Map.of(
                            "error", "No se pudieron obtener las obras",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(List.of(err)));
                });
    }

    // ================================
    // GET - Ultimas condiciones/observaciones
    // ================================
    @GetMapping("/condiciones/ultima")
    public Mono<ResponseEntity<Object>> getUltimasCondiciones() {
        WebClient client = webClientBuilder.build();

        return client.get()
                .uri(OBRAS_URL + "/condiciones/ultima")
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        if (response.statusCode().value() == 204) {
                            return Mono.just(ResponseEntity.<Object>noContent().build());
                        }
                        return response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                                .map(body -> ResponseEntity.<Object>ok(body));
                    }
                    return Mono.just(ResponseEntity.<Object>status(response.statusCode()).build());
                })
                .onErrorResume(ex -> Mono.just(ResponseEntity.<Object>noContent().build()));
    }
    // ================================
    // ðŸ“„ GET - Obtener Obra completa
    // ================================
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getObraCompleta(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        Mono<Map<String, Object>> obraMono = client.get()
                .uri(OBRAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(ex -> Mono.empty());

        return obraMono.flatMap(obra -> {
            Object idClienteObj = obra.get("id_cliente");
            List<Long> clienteIds = (idClienteObj instanceof Number num)
                    ? List.of(num.longValue())
                    : List.of();

            Mono<Map<Long, Map<String, Object>>> clientesMapMono = fetchClientesByIds(client, clienteIds);

            Mono<List<Map<String, Object>>> costosMono = client.get()
                    .uri(COSTOS_URL + "/{id}", id)
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .collectList()
                    .onErrorResume(ex -> Mono.just(List.of()))
                    .cache();

            Mono<List<Map<String, Object>>> tareasMono = client.get()
                    .uri(TAREAS_URL + "/{id}", id)
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .collectList()
                    .onErrorResume(ex -> Mono.just(List.of()))
                    .cache();

            Mono<Map<Long, Map<String, Object>>> proveedoresMapMono = Mono.zip(costosMono, tareasMono)
                    .flatMap(tuple -> {
                        List<Map<String, Object>> costos = tuple.getT1();
                        List<Map<String, Object>> tareas = tuple.getT2();
                        Set<Long> ids = new HashSet<>();
                        costos.forEach(c -> {
                            Object idProv = c.get("id_proveedor");
                            if (idProv instanceof Number num) {
                                ids.add(num.longValue());
                            }
                        });
                        tareas.forEach(t -> {
                            Object idProv = t.get("id_proveedor");
                            if (idProv instanceof Number num) {
                                ids.add(num.longValue());
                            }
                        });
                        return fetchProveedoresByIds(client, ids.stream().toList());
                    });

            return Mono.zip(costosMono, tareasMono, clientesMapMono, proveedoresMapMono)
                    .map(tuple -> {
                        List<Map<String, Object>> costos = tuple.getT1();
                        List<Map<String, Object>> tareas = tuple.getT2();
                        Map<Long, Map<String, Object>> clientesMap = tuple.getT3();
                        Map<Long, Map<String, Object>> proveedoresMap = tuple.getT4();

                        costos.forEach(costo -> {
                            Object idProv = costo.get("id_proveedor");
                            if (idProv instanceof Number num) {
                                Map<String, Object> proveedor = proveedoresMap.get(num.longValue());
                                costo.put("proveedor", proveedor == null || proveedor.isEmpty() ? null : proveedor);
                            } else {
                                costo.put("proveedor", null);
                            }
                            costo.remove("id_proveedor");
                        });

                        tareas.forEach(tarea -> {
                            Object idProv = tarea.get("id_proveedor");
                            if (idProv instanceof Number num) {
                                Map<String, Object> proveedor = proveedoresMap.get(num.longValue());
                                tarea.put("proveedor", proveedor == null || proveedor.isEmpty() ? null : proveedor);
                            } else {
                                tarea.put("proveedor", null);
                            }
                            tarea.remove("id_proveedor");
                        });

                        Map<String, Object> cliente = null;
                        if (idClienteObj instanceof Number num) {
                            cliente = clientesMap.get(num.longValue());
                        }

                        obra.put("cliente", (cliente == null || cliente.isEmpty()) ? null : cliente);
                        obra.put("costos", costos);
                        obra.put("tareas", tareas);
                        obra.remove("id_cliente");

                        return ResponseEntity.ok(obra);
                    });
        }).switchIfEmpty(Mono.just(ResponseEntity.notFound().build()))
                .onErrorResume(ex -> {
                    Map<String, Object> err = Map.of(
                            "error", "No se pudo obtener la obra completa",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(err));
                });
    }

    private Mono<Map<Long, Map<String, Object>>> fetchClientesByIds(WebClient client, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Mono.just(Map.of());
        }
        String url = UriComponentsBuilder.fromHttpUrl(CLIENTES_URL + "/batch")
                .queryParam("ids", String.join(",", ids.stream().map(String::valueOf).toList()))
                .toUriString();
        return client.get()
                .uri(url)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(this::mapById)
                .onErrorResume(ex -> Mono.just(Map.of()));
    }

    private Mono<Map<Long, Map<String, Object>>> fetchProveedoresByIds(WebClient client, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Mono.just(Map.of());
        }
        String url = UriComponentsBuilder.fromHttpUrl(PROVEEDORES_URL + "/batch")
                .queryParam("ids", String.join(",", ids.stream().map(String::valueOf).toList()))
                .toUriString();
        return client.get()
                .uri(url)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(this::mapById)
                .onErrorResume(ex -> Mono.just(Map.of()));
    }

    private Map<Long, Map<String, Object>> mapById(List<Map<String, Object>> rows) {
        Map<Long, Map<String, Object>> result = new HashMap<>();
        if (rows == null) {
            return result;
        }
        for (Map<String, Object> row : rows) {
            Object idObj = row.get("id");
            if (idObj instanceof Number num) {
                result.put(num.longValue(), row);
            }
        }
        return result;
    }
}

