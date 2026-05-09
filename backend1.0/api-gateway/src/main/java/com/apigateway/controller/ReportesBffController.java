package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URISyntaxException;
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

    @Value("${services.transacciones.url}")
    private String transaccionesServiceUrl;

    @Value("${services.obras.url}")
    private String obrasServiceUrl;

    @Value("${services.clientes.url}")
    private String clientesServiceUrl;

    @Value("${services.proveedores.url}")
    private String proveedoresServiceUrl;

    // ---------- CATÁLOGOS ----------

    @GetMapping("/catalogos/filtros-cuenta-corriente")
    public Mono<ResponseEntity<Map<String, Object>>> getCatalogosFiltroCuentaCorriente() {
        return Mono.zip(
                fetchGrupos(),
                fetchObras(),
                fetchClientes(),
                fetchProveedores()
        ).map(tuple -> {
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("grupos", tuple.getT1());
            result.put("obras", tuple.getT2());
            result.put("clientes", tuple.getT3());
            result.put("proveedores", tuple.getT4());
            return ResponseEntity.ok(result);
        }).onErrorResume(e -> {
            Map<String, Object> errorResult = new java.util.HashMap<>();
            errorResult.put("error", "Error al cargar catálogos: " + e.getMessage());
            return Mono.just(ResponseEntity.internalServerError().body(errorResult));
        });
    }

    private Mono<List<Map<String, Object>>> fetchGrupos() {
        return webClientBuilder.build()
                .get()
                .uri(obrasServiceUrl + "/grupos-obras")
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .onErrorResume(e -> Mono.just(List.of()));
    }

    private Mono<List<Map<String, Object>>> fetchObras() {
        return webClientBuilder.build()
                .get()
                .uri(obrasServiceUrl + "?size=1000")
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(list -> list.stream()
                    .map(obj -> {
                        Map<String, Object> result = new java.util.HashMap<>();
                        result.put("id", obj.get("id"));
                        result.put("nombre", obj.get("nombre"));
                        return result;
                    })
                    .toList())
                .onErrorResume(e -> {
                    System.err.println("Error fetching obras: " + e.getMessage());
                    return Mono.just(List.of());
                });
    }

    private Mono<List<Map<String, Object>>> fetchClientes() {
        return webClientBuilder.build()
                .get()
                .uri(clientesServiceUrl)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(list -> list.stream()
                    .map(obj -> {
                        Map<String, Object> result = new java.util.HashMap<>();
                        result.put("id", obj.get("id"));
                        result.put("nombre", obj.get("nombre"));
                        return result;
                    })
                    .toList())
                .onErrorResume(e -> {
                    System.err.println("Error fetching clientes: " + e.getMessage());
                    return Mono.just(List.of());
                });
    }

    private Mono<List<Map<String, Object>>> fetchProveedores() {
        return webClientBuilder.build()
                .get()
                .uri(proveedoresServiceUrl)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(list -> list.stream()
                    .map(obj -> {
                        Map<String, Object> result = new java.util.HashMap<>();
                        result.put("id", obj.get("id"));
                        result.put("nombre", obj.get("nombre"));
                        return result;
                    })
                    .toList())
                .onErrorResume(e -> {
                    System.err.println("Error fetching proveedores: " + e.getMessage());
                    return Mono.just(List.of());
                });
    }

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

    @PostMapping("/financieros/flujo-caja-principal")
    public Mono<ResponseEntity<Object>> flujoCajaPrincipal(@RequestBody(required = false) Object filtro) {
        // Endpoint confiable que devuelve: cobrado, por_cobrar, pagado, por_pagar, resultado
        // Filtrado por 6 estados: Adjudicada, En progreso, Cobrada, Facturada, Facturada parcial, Finalizada
        String baseUrl = extractBaseUrl(transaccionesServiceUrl);
        String url = baseUrl + "/api/flujo-caja/principal";
        return webClientBuilder.build()
                .get()
                .uri(url)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Object>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body((Object) ("Error al obtener flujo de caja: " + e.getMessage()))));
    }

    @PostMapping("/financieros/dashboard")
    public Mono<ResponseEntity<Object>> dashboardFinanciero(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/dashboard", filtro, new ParameterizedTypeReference<>() {});
    }

    @PostMapping("/financieros/dashboard-consolidado")
    public Mono<ResponseEntity<Object>> dashboardConsolidado(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/dashboard-consolidado", filtro, new ParameterizedTypeReference<>() {});
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

    @PostMapping("/financieros/kpi-facturas")
    public Mono<ResponseEntity<Object>> kpiFacturas(@RequestBody(required = false) Object filtro) {
        return proxyPost("/financieros/kpi-facturas", filtro, new ParameterizedTypeReference<>() {});
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

    @PostMapping("/cuenta-corriente-pdf/proveedor/{proveedorId}")
    public Mono<ResponseEntity<Object>> cuentaCorrientePdfProveedor(
            @PathVariable("proveedorId") Long proveedorId,
            @RequestParam(name = "obraIds", required = false) List<Long> obraIds) {
        StringBuilder url = new StringBuilder(reportesServiceUrl + "/cuenta-corriente-pdf/proveedor/" + proveedorId);
        if (obraIds != null && !obraIds.isEmpty()) {
            url.append("?");
            for (int i = 0; i < obraIds.size(); i++) {
                if (i > 0) url.append("&");
                url.append("obraIds=").append(obraIds.get(i));
            }
        }
        return webClientBuilder.build()
                .post()
                .uri(url.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Object>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body((Object) ("Error al obtener datos: " + e.getMessage()))));
    }

    @PostMapping("/cuenta-corriente-pdf/cliente/{clienteId}")
    public Mono<ResponseEntity<Object>> cuentaCorrientePdfCliente(
            @PathVariable("clienteId") Long clienteId,
            @RequestParam(name = "obraIds", required = false) List<Long> obraIds) {
        StringBuilder url = new StringBuilder(reportesServiceUrl + "/cuenta-corriente-pdf/cliente/" + clienteId);
        if (obraIds != null && !obraIds.isEmpty()) {
            url.append("?");
            for (int i = 0; i < obraIds.size(); i++) {
                if (i > 0) url.append("&");
                url.append("obraIds=").append(obraIds.get(i));
            }
        }
        return webClientBuilder.build()
                .post()
                .uri(url.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Object>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body((Object) ("Error al obtener datos: " + e.getMessage()))));
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

    @GetMapping("/operativos/avance-pagos-obra/{obraId}")
    public Mono<ResponseEntity<Object>> avancePagosObra(@PathVariable("obraId") Long obraId) {
        return proxyGet("/operativos/avance-pagos-obra/" + obraId, new ParameterizedTypeReference<>() {});
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

    // ---------- MOVIMIENTOS ----------

    @GetMapping("/movimientos/recientes")
    public Mono<ResponseEntity<Object>> getUltimosMovimientos() {
        String baseUrl = extractBaseUrl(transaccionesServiceUrl);
        String url = baseUrl + "/api/transacciones/recientes";
        return webClientBuilder.build()
                .get()
                .uri(url)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Object>() {})
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body((Object) ("Error al obtener movimientos recientes: " + e.getMessage()))));
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

    // ---------- SALDOS ----------

    @GetMapping("/financieros/saldos/cliente/{clienteId}")
    public Mono<ResponseEntity<Object>> saldosCliente(@PathVariable("clienteId") Long clienteId) {
        return proxyGet("/financieros/saldos/cliente/" + clienteId, new ParameterizedTypeReference<>() {});
    }

    @GetMapping("/financieros/saldos/proveedor/{proveedorId}")
    public Mono<ResponseEntity<Object>> saldosProveedor(@PathVariable("proveedorId") Long proveedorId) {
        return proxyGet("/financieros/saldos/proveedor/" + proveedorId, new ParameterizedTypeReference<>() {});
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

    /**
     * Extrae la URL base (esquema + host + puerto) de una URL completa.
     * Ej: http://localhost:8086/api/transacciones -> http://localhost:8086
     * Más robusto que regex: tolera cambios en la estructura de la ruta.
     */
    private String extractBaseUrl(String fullUrl) {
        try {
            URI uri = new URI(fullUrl);
            int port = uri.getPort();
            String baseUrl = String.format("%s://%s", uri.getScheme(), uri.getHost());

            // Incluir puerto si no es el default
            if (port != -1) {
                baseUrl += ":" + port;
            }
            return baseUrl;
        } catch (URISyntaxException e) {
            // Fallback: intenta extraer todo antes de /api/
            int apiIndex = fullUrl.indexOf("/api/");
            if (apiIndex > 0) {
                return fullUrl.substring(0, apiIndex);
            }
            // Si todo falla, retorna la URL tal cual
            return fullUrl;
        }
    }
}
