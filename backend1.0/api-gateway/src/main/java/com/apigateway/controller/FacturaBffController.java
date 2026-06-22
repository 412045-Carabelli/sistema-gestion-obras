package com.apigateway.controller;

import com.apigateway.service.PushTriggerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bff/facturas")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class FacturaBffController {

    @Value("${services.facturas.url}")
    private String FACTURAS_URL;

    @Value("${services.obras.url}")
    private String OBRAS_URL;

    @Value("${services.clientes.url}")
    private String CLIENTES_URL;

    private static final List<String> ESTADOS_FACTURABLES = List.of(
        "ADJUDICADA", "EN_PROGRESO", "FINALIZADA", "COBRADA",
        "FACTURADA", "FACTURADA_PARCIAL", "FACTURADA_TOTAL"
    );

    private final WebClient.Builder webClientBuilder;
    private final PushTriggerService pushTriggerService;

    @GetMapping
    public Mono<ResponseEntity<List<Map<String, Object>>>> getAll(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long idCliente,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        return webClientBuilder.build()
                .get()
                .uri(uriBuilder -> {
                    URI base = URI.create(FACTURAS_URL);
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
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> getById(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/{id}", id)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok);
    }

    @GetMapping("/cliente/{idCliente}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getByCliente(
            @PathVariable("idCliente") Long idCliente,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/cliente/{idCliente}", idCliente)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    @GetMapping("/obra/{idObra}")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getByObra(
            @PathVariable("idObra") Long idObra,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/obra/{idObra}", idObra)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .map(ResponseEntity::ok);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> create(
            @RequestPart("id_cliente") String idCliente,
            @RequestPart(value = "id_obra", required = false) String idObra,
            @RequestPart("monto") String monto,
            @RequestPart(value = "monto_restante", required = false) String montoRestante,
            @RequestPart("fecha") String fecha,
            @RequestPart(value = "descripcion", required = false) String descripcion,
            @RequestPart(value = "estado", required = false) String estado,
            @RequestPart(value = "impacta_cta_cte", required = false) String impactaCtaCte,
            @RequestPart(value = "file", required = false) FilePart filePart,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName
    ) {
        MultipartBodyBuilder builder = buildMultipart(idCliente, idObra, monto, montoRestante, fecha, descripcion, estado, impactaCtaCte, filePart);
        return webClientBuilder.build()
                .post()
                .uri(FACTURAS_URL)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .exchangeToMono(response -> response
                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .doOnNext(body -> {
                            if (response.statusCode().is2xxSuccessful()) {
                                pushTriggerService.triggerNotification(
                                        organizacionId, userId, userName,
                                        "factura", descripcion != null ? descripcion : "Factura $" + monto);
                            }
                        })
                        .map(body -> ResponseEntity.status(response.statusCode()).body(body)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> update(
            @PathVariable("id") Long id,
            @RequestPart("id_cliente") String idCliente,
            @RequestPart(value = "id_obra", required = false) String idObra,
            @RequestPart("monto") String monto,
            @RequestPart(value = "monto_restante", required = false) String montoRestante,
            @RequestPart("fecha") String fecha,
            @RequestPart(value = "descripcion", required = false) String descripcion,
            @RequestPart(value = "estado", required = false) String estado,
            @RequestPart(value = "impacta_cta_cte", required = false) String impactaCtaCte,
            @RequestPart(value = "file", required = false) FilePart filePart,
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        MultipartBodyBuilder builder = buildMultipart(idCliente, idObra, monto, montoRestante, fecha, descripcion, estado, impactaCtaCte, filePart);
        return webClientBuilder.build()
                .put()
                .uri(FACTURAS_URL + "/{id}", id)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .exchangeToMono(response -> response
                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .map(body -> ResponseEntity.status(response.statusCode()).body(body)));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable("id") Long id) {
        return webClientBuilder.build()
                .delete()
                .uri(FACTURAS_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }

    @GetMapping(value = "/{id}/download", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public Mono<Void> download(@PathVariable("id") Long id, ServerHttpResponse response) {
        return webClientBuilder.build()
                .get()
                .uri(FACTURAS_URL + "/{id}/download", id)
                .exchangeToMono(clientResponse -> {
                    response.setStatusCode(clientResponse.statusCode());
                    response.getHeaders().putAll(clientResponse.headers().asHttpHeaders());
                    return response.writeWith(clientResponse.bodyToFlux(org.springframework.core.io.buffer.DataBuffer.class));
                })
                .onErrorResume(ex -> {
                    response.setStatusCode(org.springframework.http.HttpStatus.NOT_FOUND);
                    return response.setComplete();
                });
    }

    @GetMapping("/resumen")
    public Mono<ResponseEntity<Map<String, Object>>> getResumen(
            @RequestHeader(value = "X-Organizacion-Id", required = false) String organizacionId
    ) {
        WebClient client = webClientBuilder.build();

        Mono<List<Map<String, Object>>> facturasMono = client.get()
                .uri(FACTURAS_URL)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()));

        Mono<List<Map<String, Object>>> clientesMono = client.get()
                .uri(CLIENTES_URL)
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .onErrorResume(ex -> Mono.just(List.of()));

        Mono<List<Map<String, Object>>> obrasMono = client.get()
                .uri(b -> {
                    URI base = URI.create(OBRAS_URL);
                    var builder = b.scheme(base.getScheme()).host(base.getHost());
                    if (base.getPort() != -1) builder.port(base.getPort());
                    builder.path(base.getPath() + "/resumen");
                    builder.queryParam("activo", "true");
                    builder.queryParam("size", "1000");
                    return builder.build();
                })
                .headers(h -> { if (organizacionId != null) h.set("X-Organizacion-Id", organizacionId); })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(page -> {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> content =
                            (List<Map<String, Object>>) page.getOrDefault("content", List.of());
                    return content;
                })
                .onErrorResume(ex -> Mono.just(List.of()));

        return Mono.zip(facturasMono, clientesMono, obrasMono)
                .map(tuple -> {
                    List<Map<String, Object>> facturas = tuple.getT1();
                    List<Map<String, Object>> clientes = tuple.getT2();
                    List<Map<String, Object>> obras = tuple.getT3();

                    // Índices para lookup
                    Map<Long, String> clienteNombres = new HashMap<>();
                    for (var c : clientes) {
                        Object id = c.get("id");
                        if (id != null) clienteNombres.put(((Number) id).longValue(),
                                (String) c.getOrDefault("nombre", ""));
                    }

                    Map<Long, Map<String, Object>> obrasById = new HashMap<>();
                    for (var o : obras) {
                        Object id = o.get("id");
                        if (id != null) obrasById.put(((Number) id).longValue(), o);
                    }

                    // Enriquecer facturas y agrupar por obra
                    Map<Long, List<Map<String, Object>>> facturasByObra = new HashMap<>();
                    double totalFacturado = 0;
                    double totalCobrado = 0;
                    double totalPorCobrar = 0;

                    List<Map<String, Object>> facturasEnriquecidas = new ArrayList<>();
                    for (var f : facturas) {
                        Map<String, Object> enriched = new HashMap<>(f);
                        Object idCliente = f.get("id_cliente");
                        Object idObra = f.get("id_obra");

                        if (idCliente != null)
                            enriched.put("nombre_cliente",
                                    clienteNombres.getOrDefault(((Number) idCliente).longValue(), "Sin cliente"));

                        if (idObra != null) {
                            long obraId = ((Number) idObra).longValue();
                            Map<String, Object> obra = obrasById.get(obraId);
                            enriched.put("nombre_obra", obra != null
                                    ? obra.getOrDefault("nombre", "Obra #" + obraId)
                                    : "Obra #" + obraId);
                            facturasByObra.computeIfAbsent(obraId, k -> new ArrayList<>()).add(enriched);
                        }

                        double monto = ((Number) f.getOrDefault("monto", 0)).doubleValue();
                        totalFacturado += monto;

                        String estado = (String) f.getOrDefault("estado", "EMITIDA");
                        if ("COBRADA".equalsIgnoreCase(estado)) {
                            totalCobrado += monto;
                        } else {
                            Object mr = f.get("monto_restante");
                            totalPorCobrar += mr != null ? ((Number) mr).doubleValue() : monto;
                        }

                        facturasEnriquecidas.add(enriched);
                    }

                    // Obras facturables con sus facturas agrupadas
                    double totalPorFacturar = 0;
                    List<Map<String, Object>> obrasFacturacion = new ArrayList<>();
                    for (var o : obras) {
                        if (!Boolean.TRUE.equals(o.get("requiere_factura"))) continue;
                        if (Boolean.FALSE.equals(o.get("activo"))) continue;

                        Object estadoRaw = o.get("obra_estado");
                        String estadoStr = estadoRaw != null ? estadoRaw.toString().toUpperCase() : "";
                        if (!ESTADOS_FACTURABLES.contains(estadoStr)) continue;

                        Object idO = o.get("id");
                        long obraId = idO != null ? ((Number) idO).longValue() : 0;

                        Object idClienteO = o.get("id_cliente");
                        String clienteNombre = idClienteO != null
                                ? clienteNombres.getOrDefault(((Number) idClienteO).longValue(), "Sin cliente")
                                : "Sin cliente";

                        double presupuesto = ((Number) o.getOrDefault("presupuesto", 0)).doubleValue();
                        List<Map<String, Object>> facturasObra =
                                facturasByObra.getOrDefault(obraId, List.of());
                        double facturado = facturasObra.stream()
                                .mapToDouble(f -> ((Number) f.getOrDefault("monto", 0)).doubleValue())
                                .sum();
                        double porFacturar = Math.max(0, presupuesto - facturado);
                        totalPorFacturar += porFacturar;

                        Map<String, Object> obraFact = new LinkedHashMap<>();
                        obraFact.put("id", obraId);
                        obraFact.put("nombre", o.getOrDefault("nombre", "Obra #" + obraId));
                        obraFact.put("clienteNombre", clienteNombre);
                        obraFact.put("estado", estadoStr);
                        obraFact.put("presupuesto", presupuesto);
                        obraFact.put("facturado", facturado);
                        obraFact.put("porFacturar", porFacturar);
                        obraFact.put("facturas", facturasObra);
                        obrasFacturacion.add(obraFact);
                    }

                    // KPIs
                    Map<String, Object> kpis = new LinkedHashMap<>();
                    kpis.put("totalFacturado", totalFacturado);
                    kpis.put("totalCobrado", totalCobrado);
                    kpis.put("totalPorCobrar", totalPorCobrar);
                    kpis.put("totalPorFacturar", totalPorFacturar);

                    // Clientes slim para filtros
                    List<Map<String, Object>> clientesSlim = clientes.stream()
                            .map(c -> Map.<String, Object>of(
                                    "id", c.getOrDefault("id", 0),
                                    "nombre", c.getOrDefault("nombre", "")))
                            .collect(Collectors.toList());

                    // Obras slim para modal y filtros
                    List<Map<String, Object>> obrasSlim = obras.stream()
                            .map(o -> {
                                Map<String, Object> slim = new HashMap<>();
                                slim.put("id", o.get("id"));
                                slim.put("nombre", o.get("nombre"));
                                slim.put("id_cliente", o.get("id_cliente"));
                                slim.put("obra_estado", o.get("obra_estado"));
                                slim.put("requiere_factura", o.get("requiere_factura"));
                                slim.put("activo", o.get("activo"));
                                slim.put("presupuesto", o.get("presupuesto"));
                                return slim;
                            })
                            .collect(Collectors.toList());

                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("facturas", facturasEnriquecidas);
                    result.put("obrasFacturacion", obrasFacturacion);
                    result.put("kpis", kpis);
                    result.put("clientes", clientesSlim);
                    result.put("obras", obrasSlim);

                    return ResponseEntity.ok(result);
                });
    }

    private MultipartBodyBuilder buildMultipart(
            String idCliente,
            String idObra,
            String monto,
            String montoRestante,
            String fecha,
            String descripcion,
            String estado,
            String impactaCtaCte,
            FilePart filePart
    ) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("id_cliente", idCliente);
        if (idObra != null && !idObra.isBlank()) {
            builder.part("id_obra", idObra);
        }
        builder.part("monto", monto);
        if (montoRestante != null && !montoRestante.isBlank()) {
            builder.part("monto_restante", montoRestante);
        }
        builder.part("fecha", fecha);
        if (descripcion != null) {
            builder.part("descripcion", descripcion);
        }
        if (estado != null) {
            builder.part("estado", estado);
        }
        if (impactaCtaCte != null) {
            builder.part("impacta_cta_cte", impactaCtaCte);
        }

        if (filePart != null) {
            builder.part("file", filePart)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "form-data; name=file; filename=\"" + filePart.filename() + "\"")
                    .contentType(filePart.headers().getContentType());
        }

        return builder;
    }
}
