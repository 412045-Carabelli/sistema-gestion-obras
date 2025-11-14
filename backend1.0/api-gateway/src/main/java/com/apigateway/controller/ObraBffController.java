package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff/obras")
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

    private final WebClient.Builder webClientBuilder;

    // ================================
    // 📥 POST - Crear Obra
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
    // ✏️ PUT - Actualizar Obra
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
// 🌀 PATCH - Cambiar estado de la Obra
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

        return client.patch()
                .uri(OBRAS_URL + "/{id}/activo", id)
                .retrieve()
                .toBodilessEntity()
                .map(response -> ResponseEntity.noContent().build())
                .onErrorResume(ex -> {
                    ex.printStackTrace();
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }


    // ================================
    // 📜 GET - Listar Obras (resumido)
    // ================================
    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getTodasLasObras() {
        WebClient client = webClientBuilder.build();

        Flux<Map<String, Object>> obrasFlux = client.get()
                .uri(OBRAS_URL)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {});

        Flux<Map<String, Object>> obrasEnriquecidas = obrasFlux.flatMap(obra -> {
            Object idClienteObj = obra.get("id_cliente");
            if (idClienteObj == null) {
                obra.put("cliente", null);
                obra.remove("id_cliente");
                return Mono.just(obra);
            }

            Long idCliente = ((Number) idClienteObj).longValue();
            return client.get()
                    .uri(CLIENTES_URL + "/{id}", idCliente)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorResume(ex -> Mono.empty())
                    .map(cliente -> {
                        obra.put("cliente", cliente);
                        obra.remove("id_cliente");
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
                costosMono,
                tareasMono
        ).map(tuple -> {
            Map<String, Object> obra = tuple.getT1();
            Map<String, Object> cliente = tuple.getT2();
            List<Map<String, Object>> costos = tuple.getT3();
            List<Map<String, Object>> tareas = tuple.getT4();

            obra.put("cliente", cliente.isEmpty() ? null : cliente);
            obra.put("costos", costos);
            obra.put("tareas", tareas);
            obra.remove("id_cliente");

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
