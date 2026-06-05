package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/obras")
@RequiredArgsConstructor
@Slf4j
public class ObraBffController {

    @Value("${services.obras.url}")
    private String OBRAS_URL;

    @Value("${services.clientes.url}")
    private String CLIENTES_URL;

    @Value("${services.obras.url}/costos")
    private String COSTOS_URL;

    @Value("${services.obras.tareas.url}")
    private String TAREAS_URL;

    @Value("${services.obras.url}/grupos-obras")
    private String GRUPOS_URL;

    @Value("${services.proveedores.url}")
    private String PROVEEDORES_URL;

    @Value("${services.transacciones.url}")
    private String TRANSACCIONES_URL;

    private final WebClient.Builder webClientBuilder;

    // ================================
    // 📥 POST - Crear Obra
    // ================================
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("permitAll()")  // TODO: cambiar a hasRole('ADMIN') o hasRole('OBRAS') cuando JWT esté listo
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
                    log.error("Error en operación de obra", ex);
                    Map<String, Object> err = Map.of(
                            "error", "No se pudo crear la obra",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(err));
                });
    }

    // ================================
    // ✏️ PUT - Actualizar Obra
    // ================================
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("permitAll()")  // TODO: cambiar a hasRole('ADMIN') o hasRole('OBRAS') cuando JWT esté listo
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
                    log.error("Error en operación de obra", ex);
                    Map<String, Object> err = Map.of(
                            "error", "No se pudo actualizar la obra",
                            "detalle", ex.getMessage()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(err));
                });
    }

    // ================================
// 🌀 PATCH - Cambiar estado de la Obra
// ================================
    @PatchMapping("/{id}/estado/{estado}")
    @PreAuthorize("permitAll()")  // TODO: cambiar a hasRole('ADMIN') o hasRole('OBRAS') cuando JWT esté listo
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
                    log.error("Error en operación de obra", ex);
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
    // 📜 GET - Listar Obras (resumido)
    // ================================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTodasLasObras(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long idCliente,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
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
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        Flux<Map<String, Object>> obrasEnriquecidas = obrasFlux.flatMap(obra -> {
            Object idClienteObj = obra.get("id_cliente");
            Object idGrupoObj = obra.get("id_grupo");

            Mono<Map<String, Object>> clienteMono2 = idClienteObj == null
                    ? Mono.just(Map.of())
                    : client.get()
                    .uri(CLIENTES_URL + "/{id}", ((Number) idClienteObj).longValue())
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorResume(ex -> Mono.just(Map.of()));

            Mono<Map<String, Object>> grupoMono2 = idGrupoObj == null
                    ? Mono.just(Map.of())
                    : client.get()
                    .uri(GRUPOS_URL + "/{id}", ((Number) idGrupoObj).longValue())
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorResume(ex -> Mono.just(Map.of()));

            return Mono.zip(clienteMono2, grupoMono2)
                    .map(tuple -> {
                        obra.put("cliente", tuple.getT1().isEmpty() ? null : tuple.getT1());
                        obra.put("grupo", tuple.getT2().isEmpty() ? null : tuple.getT2());
                        obra.remove("id_cliente");
                        obra.remove("id_grupo");
                        return obra;
                    });
        });

        return obrasEnriquecidas.collectList()
                .map(ResponseEntity::ok)
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
    // 📄 GET - Obtener Obra completa
    // ================================
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getObraCompleta(@PathVariable("id") Long id) {
        WebClient client = webClientBuilder.build();

        Mono<Map<String, Object>> obraMono = client.get()
                .uri(OBRAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(ex -> Mono.empty());

        Mono<Map<String, Object>> clienteMono = obraMono.flatMap(obra -> {
            Object idClienteObj = obra.get("id_cliente");
            if (idClienteObj == null) return Mono.empty();

            Long idCliente = ((Number) idClienteObj).longValue();
            return client.get()
                    .uri(CLIENTES_URL + "/{id}", idCliente)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorResume(ex -> Mono.empty());
        });

        Mono<Map<String, Object>> grupoMono = obraMono.flatMap(obra -> {
            Object idGrupoObj = obra.get("id_grupo");
            if (idGrupoObj == null) return Mono.empty();

            Long idGrupo = ((Number) idGrupoObj).longValue();
            return client.get()
                    .uri(GRUPOS_URL + "/{id}", idGrupo)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorResume(ex -> Mono.empty());
        });

        Mono<List<Map<String, Object>>> costosMono = client.get()
                .uri(COSTOS_URL + "/{id}", id)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .flatMap(costo -> {
                    Object idProvObj = costo.get("id_proveedor");
                    if (idProvObj == null) return Mono.just(costo);

                    Long idProveedor = ((Number) idProvObj).longValue();
                    return client.get()
                            .uri(PROVEEDORES_URL + "/{id}", idProveedor)
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                            .onErrorResume(ex -> Mono.just(Map.of()))
                            .map(proveedor -> {
                                costo.put("proveedor", proveedor);
                                costo.remove("id_proveedor");
                                return costo;
                            });
                })
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()));

        Mono<List<Map<String, Object>>> tareasMono = client.get()
                .uri(TAREAS_URL + "/{id}", id)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .flatMap(tarea -> {
                    Object idProvObj = tarea.get("id_proveedor");
                    if (idProvObj == null) return Mono.just(tarea);

                    Long idProveedor = ((Number) idProvObj).longValue();
                    return client.get()
                            .uri(PROVEEDORES_URL + "/{id}", idProveedor)
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                            .onErrorResume(ex -> Mono.just(Map.of()))
                            .map(proveedor -> {
                                tarea.put("proveedor", proveedor);
                                tarea.remove("id_proveedor");
                                return tarea;
                            });
                })
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()));

        return Mono.zip(
                obraMono,
                clienteMono.switchIfEmpty(Mono.just(Map.of())),
                grupoMono.switchIfEmpty(Mono.just(Map.of())),
                costosMono,
                tareasMono
        ).map(tuple -> {
            Map<String, Object> obra = tuple.getT1();
            Map<String, Object> cliente = tuple.getT2();
            Map<String, Object> grupo = tuple.getT3();
            List<Map<String, Object>> costos = tuple.getT4();
            List<Map<String, Object>> tareas = tuple.getT5();

            if (!cliente.isEmpty()) {
                Map<String, Object> clienteSlim = new java.util.HashMap<>(cliente);
                clienteSlim.remove("obras");
                obra.put("cliente", clienteSlim);
            } else {
                obra.put("cliente", null);
            }
            obra.put("grupo", grupo.isEmpty() ? null : grupo);
            obra.put("costos", costos);
            obra.put("tareas", tareas);
            obra.remove("id_cliente");
            obra.remove("id_grupo");

            return ResponseEntity.ok(obra);
        }).onErrorResume(ex -> {
            Map<String, Object> err = Map.of(
                    "error", "No se pudo obtener la obra completa",
                    "detalle", ex.getMessage()
            );
            return Mono.just(ResponseEntity.internalServerError().body(err));
        });
    }
}

