package com.apigateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/bff/whatsapp")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class WhatsAppBffController {

    private final WebClient.Builder webClientBuilder;

    @Value("${whatsapp.access-token}")
    private String accessToken;

    @Value("${whatsapp.phone-number-id}")
    private String phoneNumberId;

    @Value("${whatsapp.template.presupuesto:sgo_presupuesto}")
    private String templatePresupuesto;

    @Value("${whatsapp.template.language:es_AR}")
    private String templateLanguage;

    @Value("${whatsapp.verify-token:sgo_webhook_verify_token}")
    private String verifyToken;

    @Value("${services.agendas.url:http://agendas-service:8085}")
    private String agendasUrl;

    @Value("${services.reportes.url:http://reportes-service:8084}")
    private String reportesUrl;

    private static final String META_API_URL = "https://graph.facebook.com/v21.0";

    /**
     * Envía el presupuesto de una obra al cliente por WhatsApp.
     * Utiliza el template 'sgo_presupuesto' aprobado en Meta Business Manager.
     *
     * Parámetros del template:
     *   {{1}} clienteNombre
     *   {{2}} obraNombre
     *   {{3}} presupuestoTotal (formateado)
     *   {{4}} fechaPresupuesto
     */
    @PostMapping("/presupuesto")
    public Mono<ResponseEntity<Map<String, Object>>> enviarPresupuesto(
            @RequestBody EnviarPresupuestoRequest request) {

        if (request.telefono() == null || request.telefono().isBlank()) {
            return Mono.just(ResponseEntity.badRequest()
                .body(Map.of("success", false, "error", "El cliente no tiene teléfono registrado")));
        }

        String apiUrl = META_API_URL + "/" + phoneNumberId + "/messages";

        Map<String, Object> templateBody = Map.of(
            "messaging_product", "whatsapp",
            "to", normalizarTelefono(request.telefono()),
            "type", "template",
            "template", Map.of(
                "name", templatePresupuesto,
                "language", Map.of("code", templateLanguage),
                "components", List.of(
                    Map.of(
                        "type", "body",
                        "parameters", List.of(
                            Map.of("type", "text", "text", request.clienteNombre()),
                            Map.of("type", "text", "text", request.obraNombre()),
                            Map.of("type", "text", "text", request.presupuestoTotal()),
                            Map.of("type", "text", "text", request.fechaPresupuesto())
                        )
                    )
                )
            )
        );

        log.info("Enviando WhatsApp a {} con phoneNumberId={} token_prefix={}",
            request.telefono(), phoneNumberId,
            accessToken != null && accessToken.length() > 10 ? accessToken.substring(0, 10) + "..." : "VACIO");

        return webClientBuilder.build()
            .post()
            .uri(apiUrl)
            .header("Authorization", "Bearer " + accessToken)
            .bodyValue(templateBody)
            .retrieve()
            .onStatus(status -> status.isError(), clientResponse ->
                clientResponse.bodyToMono(String.class).doOnNext(body ->
                    log.error("Meta API error body: {}", body)
                ).map(body -> new RuntimeException("Meta error " + clientResponse.statusCode() + ": " + body))
            )
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
            .map(response -> {
                log.info("Presupuesto WhatsApp enviado a {} para obra '{}'",
                    request.telefono(), request.obraNombre());
                return ResponseEntity.ok(Map.of("success", true, "whatsappResponse", response));
            })
            .onErrorResume(e -> {
                log.error("Error enviando presupuesto WhatsApp a {}: {}", request.telefono(), e.getMessage());
                return Mono.just(ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage())));
            });
    }

    /**
     * Normaliza el teléfono al formato internacional sin '+'.
     * WhatsApp requiere: 549XXXXXXXXXX (Argentina)
     * Se eliminan todos los caracteres no numéricos.
     */
    /**
     * Trigger manual: notifica tareas que vencen en las próximas 24h.
     */
    @PostMapping("/agenda/trigger")
    public Mono<ResponseEntity<Map<String, Object>>> triggerAgendaNotificaciones() {
        return webClientBuilder.build()
            .post()
            .uri(agendasUrl + "/api/agenda/whatsapp/trigger")
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
            .map(ResponseEntity::ok)
            .onErrorResume(e -> {
                log.error("Error en trigger agenda WhatsApp: {}", e.getMessage());
                return Mono.just(ResponseEntity.internalServerError()
                    .body(Map.of("ok", false, "error", e.getMessage() != null ? e.getMessage() : "Error desconocido")));
            });
    }

    /**
     * Trigger manual: resumen semanal de tareas que vencen en los próximos 7 días.
     */
    @PostMapping("/agenda/resumen-semanal")
    public Mono<ResponseEntity<Map<String, Object>>> triggerResumenSemanal() {
        return webClientBuilder.build()
            .post()
            .uri(agendasUrl + "/api/agenda/whatsapp/resumen-semanal")
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
            .map(ResponseEntity::ok)
            .onErrorResume(e -> {
                log.error("Error en resumen semanal WhatsApp: {}", e.getMessage());
                return Mono.just(ResponseEntity.internalServerError()
                    .body(Map.of("ok", false, "error", e.getMessage() != null ? e.getMessage() : "Error desconocido")));
            });
    }

    /**
     * GET /bff/whatsapp/webhook
     * Meta llama a este endpoint para verificar el webhook al configurarlo.
     * Responde con hub.challenge si el token coincide.
     */
    @GetMapping("/webhook")
    public ResponseEntity<String> verificarWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        log.info("Verificación webhook recibida — mode={} token_match={}", mode, verifyToken.equals(token));

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(403).body("Forbidden");
    }

    /**
     * POST /bff/whatsapp/webhook
     * Meta envía aquí los mensajes entrantes y actualizaciones de estado.
     * Siempre responde 200 OK inmediatamente (Meta reintenta si no recibe respuesta).
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> recibirMensaje(@RequestBody Map<String, Object> body) {
        log.info("Webhook WhatsApp recibido: {}", body);

        extraerMensaje(body).ifPresent(msg -> procesarComando(msg.from(), msg.texto()).subscribe());

        return ResponseEntity.ok("EVENT_RECEIVED");
    }

    private Optional<MensajeEntrante> extraerMensaje(Map<String, Object> body) {
        try {
            List<?> entries = (List<?>) body.get("entry");
            if (entries == null || entries.isEmpty()) return Optional.empty();

            Map<?, ?> entry = (Map<?, ?>) entries.get(0);
            List<?> changes = (List<?>) entry.get("changes");
            if (changes == null || changes.isEmpty()) return Optional.empty();

            Map<?, ?> value = (Map<?, ?>) ((Map<?, ?>) changes.get(0)).get("value");
            if (value == null) return Optional.empty();

            List<?> messages = (List<?>) value.get("messages");
            if (messages == null || messages.isEmpty()) return Optional.empty();

            Map<?, ?> msg = (Map<?, ?>) messages.get(0);
            String from = (String) msg.get("from");
            String tipo = (String) msg.get("type");

            if (!"text".equals(tipo)) return Optional.empty();

            Map<?, ?> textObj = (Map<?, ?>) msg.get("text");
            String texto = textObj != null ? (String) textObj.get("body") : null;

            if (from == null || texto == null) return Optional.empty();

            return Optional.of(new MensajeEntrante(from, texto.trim().toLowerCase()));
        } catch (Exception e) {
            log.warn("No se pudo parsear mensaje WhatsApp: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private Mono<Void> procesarComando(String from, String texto) {
        if (texto.contains("resumen general")) {
            return webClientBuilder.build()
                .get()
                .uri(reportesUrl + "/api/reportes/generales/resumen")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .flatMap(resumen -> {
                    String saldo = formatearResumen(resumen);
                    return enviarTexto(from, saldo);
                })
                .onErrorResume(e -> {
                    log.error("Error obteniendo resumen: {}", e.getMessage());
                    return enviarTexto(from, "No se pudo obtener el resumen. Intenta más tarde.");
                });
        }
        return enviarTexto(from,
            "Comandos disponibles:\n• *resumen general* — resumen de cuenta corriente");
    }

    private Mono<Void> enviarTexto(String to, String mensaje) {
        String apiUrl = META_API_URL + "/" + phoneNumberId + "/messages";
        Map<String, Object> body = Map.of(
            "messaging_product", "whatsapp",
            "to", to,
            "type", "text",
            "text", Map.of("body", mensaje)
        );
        return webClientBuilder.build()
            .post()
            .uri(apiUrl)
            .header("Authorization", "Bearer " + accessToken)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(Void.class)
            .onErrorResume(e -> {
                log.error("Error enviando respuesta WhatsApp a {}: {}", to, e.getMessage());
                return Mono.empty();
            });
    }

    private String formatearResumen(Map<String, Object> r) {
        return String.format("""
            📊 *Resumen General SGO*

            🏗️ Obras: %s
            👥 Clientes: %s
            🏭 Proveedores: %s
            💰 Total ingresos: $%s
            💸 Total egresos: $%s
            📈 Saldo neto: $%s
            """,
            r.getOrDefault("totalObras", 0),
            r.getOrDefault("totalClientes", 0),
            r.getOrDefault("totalProveedores", 0),
            formatNum(r.get("totalIngresos")),
            formatNum(r.get("totalEgresos")),
            calcularSaldo(r)
        );
    }

    private String formatNum(Object val) {
        if (val == null) return "0,00";
        try {
            double d = Double.parseDouble(val.toString());
            return String.format("%,.2f", d).replace(",", "X").replace(".", ",").replace("X", ".");
        } catch (Exception e) {
            return val.toString();
        }
    }

    private String calcularSaldo(Map<String, Object> r) {
        try {
            double ing = Double.parseDouble(r.getOrDefault("totalIngresos", 0).toString());
            double egr = Double.parseDouble(r.getOrDefault("totalEgresos", 0).toString());
            return formatNum(ing - egr);
        } catch (Exception e) {
            return "N/D";
        }
    }

    private record MensajeEntrante(String from, String texto) {}

    private String normalizarTelefono(String telefono) {
        return telefono.replaceAll("[^0-9]", "");
    }

    public record EnviarPresupuestoRequest(
        String telefono,
        String clienteNombre,
        String obraNombre,
        String presupuestoTotal,
        String fechaPresupuesto
    ) {}
}
