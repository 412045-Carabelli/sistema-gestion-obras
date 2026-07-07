package com.auth.controller;

import com.auth.dto.MpEstadoSuscripcionResponse;
import com.auth.dto.MpIniciarSuscripcionRequest;
import com.auth.dto.MpIniciarSuscripcionResponse;
import com.auth.service.MercadoPagoService;
import jakarta.crypto.Mac;
import jakarta.crypto.spec.SecretKeySpec;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

@RestController
@RequestMapping("/auth/mp")
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoController {

    private final MercadoPagoService mercadoPagoService;

    @Value("${mp.webhook-secret:}")
    private String webhookSecret;

    // -------------------------------------------------------------------------
    // POST /auth/mp/suscribir  (requiere X-Org-Id)
    // -------------------------------------------------------------------------

    @PostMapping("/suscribir")
    public ResponseEntity<MpIniciarSuscripcionResponse> suscribir(
            @Valid @RequestBody MpIniciarSuscripcionRequest request,
            @RequestHeader(value = "X-Org-Id", required = false) Long organizacionId) {

        if (organizacionId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        MpIniciarSuscripcionResponse response = mercadoPagoService.iniciarSuscripcion(organizacionId, request);
        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------------------
    // GET /auth/mp/suscripcion/estado  (requiere X-Org-Id)
    // -------------------------------------------------------------------------

    @GetMapping("/suscripcion/estado")
    public ResponseEntity<MpEstadoSuscripcionResponse> consultarEstado(
            @RequestHeader(value = "X-Org-Id", required = false) Long organizacionId) {

        if (organizacionId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        MpEstadoSuscripcionResponse response = mercadoPagoService.consultarEstado(organizacionId);
        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------------------
    // DELETE /auth/mp/suscripcion/cancelar  (requiere X-Org-Id)
    // -------------------------------------------------------------------------

    @DeleteMapping("/suscripcion/cancelar")
    public ResponseEntity<Void> cancelar(
            @RequestHeader(value = "X-Org-Id", required = false) Long organizacionId) {

        if (organizacionId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        mercadoPagoService.cancelarSuscripcion(organizacionId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // POST /auth/mp/webhook  (público, MP no manda auth header)
    // -------------------------------------------------------------------------

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "x-signature", required = false) String signature,
            @RequestHeader(value = "x-request-id", required = false) String requestId,
            HttpServletRequest servletRequest) {

        // 1. Validar firma HMAC-SHA256 si está configurado el secret
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            String query = servletRequest.getQueryString(); // incluye ?data.id=...&type=...
            if (!validarFirmaHmac(signature, requestId, query)) {
                log.warn("Webhook MP: firma inválida — ignorando");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

        // 2. Extraer tipo y preapproval_id
        String tipo = String.valueOf(payload.getOrDefault("type", ""));
        if (!"subscription_preapproval".equals(tipo) && !"preapproval".equals(tipo)) {
            // No es un evento de suscripción — ack sin procesar
            return ResponseEntity.ok().build();
        }

        Object dataObj = payload.get("data");
        if (!(dataObj instanceof Map<?, ?> data)) {
            return ResponseEntity.badRequest().build();
        }
        String preapprovalId = String.valueOf(data.get("id"));

        // 3. Consultar estado real en MP y procesar
        try {
            com.mercadopago.client.preapproval.PreapprovalClient client =
                    new com.mercadopago.client.preapproval.PreapprovalClient();
            com.mercadopago.resources.preapproval.Preapproval preapproval = client.get(preapprovalId);
            mercadoPagoService.procesarWebhook(preapprovalId, preapproval.getStatus());
        } catch (Exception e) {
            log.error("Error procesando webhook MP para preapproval {}: {}", preapprovalId, e.getMessage());
            // Retornar 200 de todas formas para que MP no reintente indefinidamente
        }

        return ResponseEntity.ok().build();
    }

    // -------------------------------------------------------------------------
    // Validación HMAC-SHA256
    // -------------------------------------------------------------------------

    /**
     * Valida la firma según docs MP:
     * https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
     *
     * El mensaje a firmar es: "id:{requestId};request-id:{requestId};ts:{ts};"
     * pero MP también acepta validar contra "id:{data.id};request-id:{requestId};ts:{ts};"
     * Usamos el queryString para extraer ts.
     */
    private boolean validarFirmaHmac(String signatureHeader, String requestId, String queryString) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.warn("Webhook MP: falta header x-signature");
            return false;
        }

        try {
            // x-signature = "ts=1234567890,v1=abc123hash"
            String ts = null;
            String v1 = null;
            for (String part : signatureHeader.split(",")) {
                String[] kv = part.trim().split("=", 2);
                if (kv.length == 2) {
                    if ("ts".equals(kv[0])) ts = kv[1];
                    if ("v1".equals(kv[0])) v1 = kv[1];
                }
            }

            if (ts == null || v1 == null) {
                log.warn("Webhook MP: x-signature mal formateado");
                return false;
            }

            // Extraer data.id del queryString (?data.id=XXX&type=...)
            String dataId = "";
            if (queryString != null) {
                for (String param : queryString.split("&")) {
                    if (param.startsWith("data.id=")) {
                        dataId = param.substring("data.id=".length());
                    }
                }
            }

            String mensaje = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
            String hmac = computeHmacSha256(webhookSecret, mensaje);
            boolean valido = hmac.equals(v1);
            if (!valido) {
                log.warn("Webhook MP: HMAC no coincide. esperado={} recibido={}", hmac, v1);
            }
            return valido;
        } catch (Exception e) {
            log.error("Error validando firma webhook MP: {}", e.getMessage());
            return false;
        }
    }

    private String computeHmacSha256(String secret, String data)
            throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
