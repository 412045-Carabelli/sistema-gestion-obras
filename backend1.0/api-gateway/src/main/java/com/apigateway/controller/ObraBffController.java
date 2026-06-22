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
import java.util.*;
import java.util.stream.Collectors;

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

    @Value("${services.facturas.url}")
    private String FACTURAS_URL;

    private final WebClient.Builder webClientBuilder;

    // ================================
    // 📥 POST - Crear Obra
    // ================================
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("permitAll()")  // TODO: cambiar a hasRole('ADMIN') o hasRole('OBRAS') cuando JWT esté listo
    public Mono<ResponseEntity<Map<String, Object>>> crearObra(
            @RequestBody Map<String, Object> obraDto,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        WebClient client = webClientBuilder.build();

        return client.post()
                .uri(OBRAS_URL)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(obraDto)
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                                .map(ResponseEntity::ok);
                    }
                    return response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                            .map(body -> ResponseEntity.status(response.statusCode()).body(body));
                })
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
            @RequestBody Map<String, Object> obraDto,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        WebClient client = webClientBuilder.build();

        return client.put()
                .uri(OBRAS_URL + "/{id}", id)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(obraDto)
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                                .map(ResponseEntity::ok);
                    }
                    return response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                            .map(body -> ResponseEntity.status(response.statusCode()).body(body));
                })
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
            @RequestParam(required = false) String estados,
            @RequestParam(required = false) Long idCliente,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        WebClient client = webClientBuilder.build();

        // /api/obras/resumen devuelve Page<ObraListDTO> → extraer content
        Flux<Map<String, Object>> obrasFlux = client.get()
                .uri(uriBuilder -> {
                    URI base = URI.create(OBRAS_URL + "/resumen");
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
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .flatMapMany(pageResult -> {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> content =
                        new java.util.ArrayList<>((List<Map<String, Object>>) pageResult.getOrDefault("content", List.of()));
                    if (estados != null && !estados.isBlank()) {
                        java.util.Set<String> estadosSet = new java.util.HashSet<>(java.util.Arrays.asList(estados.split(",")));
                        content.removeIf(obra -> {
                            Object obraEstado = obra.get("obra_estado");
                            return obraEstado == null || !estadosSet.contains(obraEstado.toString());
                        });
                    }
                    return Flux.fromIterable(content);
                })
                .onErrorResume(ex -> Flux.empty());

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

            return Mono.zip(
                    clienteMono2.switchIfEmpty(Mono.just(Map.of())),
                    grupoMono2.switchIfEmpty(Mono.just(Map.of()))
            )
                    .map(tuple -> {
                        Map<String, Object> clienteFull = tuple.getT1();
                        Map<String, Object> clienteSlim = clienteFull.isEmpty() ? null : Map.of(
                                "id", clienteFull.get("id"),
                                "nombre", clienteFull.getOrDefault("nombre", "")
                        );
                        Map<String, Object> grupo = tuple.getT2();
                        obra.put("cliente", clienteSlim);
                        obra.put("grupo", grupo.isEmpty() ? null : Map.of(
                                "id", grupo.get("id"),
                                "nombre", grupo.getOrDefault("nombre", "")
                        ));
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
    public Mono<ResponseEntity<Map<String, Object>>> getObraCompleta(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        WebClient client = webClientBuilder.build();

        Mono<Map<String, Object>> obraMono = client.get()
                .uri(OBRAS_URL + "/{id}", id)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
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

        Mono<List<Map<String, Object>>> transaccionesMono = client.get()
                .uri(TRANSACCIONES_URL + "/obra/{id}", id)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()));

        Mono<List<Map<String, Object>>> facturasMono = client.get()
                .uri(FACTURAS_URL + "/obra/{id}", id)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()));

        return Mono.zip(
                obraMono,
                clienteMono.switchIfEmpty(Mono.just(Map.of())),
                grupoMono.switchIfEmpty(Mono.just(Map.of())),
                costosMono,
                tareasMono,
                transaccionesMono,
                facturasMono
        ).map(tuple -> {
            Map<String, Object> obra = tuple.getT1();
            Map<String, Object> cliente = tuple.getT2();
            Map<String, Object> grupo = tuple.getT3();
            List<Map<String, Object>> costos = tuple.getT4();
            List<Map<String, Object>> tareas = tuple.getT5();
            List<Map<String, Object>> transacciones = tuple.getT6();
            List<Map<String, Object>> facturas = tuple.getT7();

            obra.put("cliente", cliente.isEmpty() ? null : cliente);
            obra.put("grupo", grupo.isEmpty() ? null : grupo);
            obra.put("costos", costos);
            obra.put("tareas", tareas);
            obra.remove("id_cliente");
            obra.remove("id_grupo");

            String estadoFinanciero = calcularEstadoFinanciero(obra, transacciones, facturas);
            if (estadoFinanciero != null) {
                obra.put("estado_financiero", estadoFinanciero);
            }

            return ResponseEntity.ok(obra);
        }).onErrorResume(ex -> {
            Map<String, Object> err = Map.of(
                    "error", "No se pudo obtener la obra completa",
                    "detalle", ex.getMessage()
            );
            return Mono.just(ResponseEntity.internalServerError().body(err));
        });
    }

    // ================================
    // 📋 GET - Listado paginado unificado (obras + estados + estado_financiero)
    // ================================
    @GetMapping("/con-detalles")
    public Mono<ResponseEntity<Map<String, Object>>> getObrasConDetalles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) String q,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        WebClient client = webClientBuilder.build();

        // 1. Slim obras paginadas con filtros
        Mono<Map<String, Object>> paginaMono = client.get()
                .uri(uriBuilder -> {
                    URI base = URI.create(OBRAS_URL + "/resumen");
                    var b = uriBuilder.scheme(base.getScheme()).host(base.getHost());
                    if (base.getPort() != -1) b.port(base.getPort());
                    if (base.getPath() != null) b.path(base.getPath());
                    b.queryParam("page", page).queryParam("size", size).queryParam("sort", "id,desc");
                    if (estado != null && !estado.isBlank()) b.queryParam("estado", estado);
                    if (activo != null) b.queryParam("activo", activo);
                    if (q != null && !q.isBlank()) b.queryParam("q", q);
                    return b.build();
                })
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(ex -> Mono.just(Map.of("content", List.of(), "totalElements", 0, "totalPages", 0)));

        // 2. Estados (estáticos)
        Mono<List<Map<String, Object>>> estadosMono = client.get()
                .uri(OBRAS_URL + "/estados")
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()));

        return Mono.zip(paginaMono, estadosMono).flatMap(outer -> {
            Map<String, Object> pagina = outer.getT1();
            List<Map<String, Object>> estados = outer.getT2();

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> obras = (List<Map<String, Object>>) pagina.getOrDefault("content", List.of());

            if (obras.isEmpty()) {
                Map<String, Object> resp = new HashMap<>(pagina);
                resp.put("estados", estados);
                return Mono.just(ResponseEntity.ok(resp));
            }

            // 3. Clientes deduplicados
            Set<Long> clienteIds = obras.stream()
                    .map(o -> o.get("id_cliente"))
                    .filter(Objects::nonNull)
                    .map(id -> ((Number) id).longValue())
                    .collect(Collectors.toSet());

            Mono<Map<Long, String>> clienteNombresMono = Flux.fromIterable(clienteIds)
                    .flatMap(idCliente -> client.get()
                            .uri(CLIENTES_URL + "/{id}", idCliente)
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                            .onErrorResume(ex -> Mono.just(Map.of()))
                            .map(c -> Map.entry(idCliente, (String) c.getOrDefault("nombre", ""))))
                    .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                    .onErrorResume(ex -> Mono.just(Map.of()));

            // 4. Facturas por obra (para estado_financiero)
            Mono<Map<Long, List<Map<String, Object>>>> facturasPorObraMono = Flux.fromIterable(obras)
                    .flatMap(obra -> {
                        Long idObra = ((Number) obra.get("id")).longValue();
                        return client.get()
                                .uri(FACTURAS_URL + "/obra/{id}", idObra)
                                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                                .retrieve()
                                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                                .collectList()
                                .onErrorResume(ex -> Mono.just(List.of()))
                                .map(facturas -> Map.entry(idObra, facturas));
                    })
                    .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                    .onErrorResume(ex -> Mono.just(Map.of()));

            return Mono.zip(clienteNombresMono, facturasPorObraMono).map(inner -> {
                Map<Long, String> clienteNombres = inner.getT1();
                Map<Long, List<Map<String, Object>>> facturasPorObra = inner.getT2();

                List<Map<String, Object>> obrasEnriquecidas = obras.stream().map(obra -> {
                    Map<String, Object> o = new HashMap<>(obra);

                    Object idClienteObj = o.remove("id_cliente");
                    o.remove("id_grupo");
                    if (idClienteObj != null) {
                        Long idCliente = ((Number) idClienteObj).longValue();
                        o.put("cliente", Map.of("id", idCliente, "nombre", clienteNombres.getOrDefault(idCliente, "")));
                    }

                    Long idObra = ((Number) o.get("id")).longValue();
                    List<Map<String, Object>> facturas = facturasPorObra.getOrDefault(idObra, List.of());
                    String ef = calcularEstadoFacturacion(o, facturas);
                    if (ef != null) o.put("estado_financiero", ef);

                    return (Map<String, Object>) o;
                }).toList();

                Map<String, Object> resp = new HashMap<>(pagina);
                resp.put("content", obrasEnriquecidas);
                resp.put("estados", estados);
                return ResponseEntity.ok(resp);
            });
        }).onErrorResume(ex -> {
            log.error("Error en /bff/obras/con-detalles", ex);
            return Mono.just(ResponseEntity.internalServerError().body(
                    Map.of("error", "No se pudieron obtener las obras", "detalle", ex.getMessage())
            ));
        });
    }

    private static final List<String> ESTADOS_CON_FACTURACION = List.of("ADJUDICADA", "EN_PROGRESO", "FINALIZADA");

    private String calcularEstadoFacturacion(Map<String, Object> obra, List<Map<String, Object>> facturas) {
        Object estadoObj = obra.get("obra_estado");
        if (estadoObj == null) return null;
        if (!ESTADOS_CON_FACTURACION.contains(estadoObj.toString().toUpperCase())) return null;

        Object presupuestoObj = obra.get("presupuesto");
        if (presupuestoObj == null) return null;
        double presupuesto = ((Number) presupuestoObj).doubleValue();
        if (presupuesto <= 0) return null;

        List<Map<String, Object>> activas = facturas.stream()
                .filter(f -> !Boolean.FALSE.equals(f.get("activo")))
                .toList();

        if (activas.isEmpty()) return "PENDIENTE";

        double totalFacturado = activas.stream()
                .mapToDouble(f -> f.get("monto") instanceof Number ? ((Number) f.get("monto")).doubleValue() : 0.0)
                .sum();

        return totalFacturado >= presupuesto ? "TOTAL" : "PARCIAL";
    }

    private String calcularEstadoFinanciero(
            Map<String, Object> obra,
            List<Map<String, Object>> transacciones,
            List<Map<String, Object>> facturas) {

        Object presupuestoObj = obra.get("presupuesto");
        if (presupuestoObj == null) return null;
        double presupuesto = ((Number) presupuestoObj).doubleValue();
        if (presupuesto <= 0) return null;

        Object requiereFacturaObj = obra.get("requiere_factura");
        boolean requiereFactura = Boolean.TRUE.equals(requiereFacturaObj);

        double totalCobros = transacciones.stream()
                .filter(t -> "COBRO".equalsIgnoreCase(String.valueOf(t.get("tipo_transaccion"))))
                .mapToDouble(t -> t.get("monto") instanceof Number ? ((Number) t.get("monto")).doubleValue() : 0.0)
                .sum();

        double totalFacturas = requiereFactura
                ? facturas.stream()
                    .mapToDouble(f -> f.get("monto") instanceof Number ? ((Number) f.get("monto")).doubleValue() : 0.0)
                    .sum()
                : 0.0;

        boolean tieneCobros = totalCobros > 0;
        boolean tieneFacturas = requiereFactura && totalFacturas > 0;

        boolean cobradaTotal   = tieneCobros && totalCobros >= presupuesto;
        boolean cobradaParcial = tieneCobros && totalCobros < presupuesto;
        boolean facturadaTotal   = tieneFacturas && totalFacturas >= presupuesto;
        boolean facturadaParcial = tieneFacturas && totalFacturas < presupuesto;

        if (cobradaTotal && facturadaTotal)   return "LIQUIDADA";
        if (cobradaParcial && facturadaParcial) return "PARCIAL";
        if (cobradaTotal)   return "COBRADA";
        if (facturadaTotal) return "FACTURADA";
        if (cobradaParcial)   return "COBRADA_PARCIAL";
        if (facturadaParcial) return "FACTURADA_PARCIAL";

        return null;
    }
}
