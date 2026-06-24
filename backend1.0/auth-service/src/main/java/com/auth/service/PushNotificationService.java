package com.auth.service;

import com.auth.dto.PushNotifyRequest;
import com.auth.dto.PushSubscriptionRequest;
import com.auth.entity.PushSubscription;
import com.auth.repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private final PushSubscriptionRepository repository;

    @Value("${vapid.public.key}")
    private String vapidPublicKey;

    @Value("${vapid.private.key}")
    private String vapidPrivateKey;

    @Value("${vapid.subject}")
    private String vapidSubject;

    private PushService pushService;

    @PostConstruct
    public void init() {
        Security.addProvider(new BouncyCastleProvider());
        try {
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
        } catch (Exception e) {
            log.error("Error inicializando PushService VAPID", e);
        }
    }

    @Transactional
    public void subscribe(Long usuarioId, Long organizacionId, PushSubscriptionRequest req) {
        Optional<PushSubscription> existing = repository.findByUsuarioIdAndEndpoint(usuarioId, req.getEndpoint());
        if (existing.isPresent()) {
            PushSubscription sub = existing.get();
            sub.setActivo(true);
            sub.setP256dh(req.getP256dh());
            sub.setAuthKey(req.getAuth());
            repository.save(sub);
            return;
        }
        PushSubscription sub = PushSubscription.builder()
                .usuarioId(usuarioId)
                .organizacionId(organizacionId)
                .endpoint(req.getEndpoint())
                .p256dh(req.getP256dh())
                .authKey(req.getAuth())
                .activo(true)
                .build();
        repository.save(sub);
    }

    @Transactional
    public void unsubscribe(Long usuarioId, String endpoint) {
        repository.findByUsuarioIdAndEndpoint(usuarioId, endpoint)
                .ifPresent(sub -> {
                    sub.setActivo(false);
                    repository.save(sub);
                });
    }

    public void notifyAdmins(PushNotifyRequest req) {
        List<PushSubscription> subscriptions = repository.findByOrganizacionIdAndActivoTrue(req.getOrganizacionId());
        if (subscriptions.isEmpty()) return;

        String entityLabel = translateEntity(req.getEntity());
        String entitySuffix = (req.getEntityName() != null && !req.getEntityName().isEmpty())
                ? " " + req.getEntityName() : "";
        String body = req.getFromUsername() + " agregó " + entityLabel + entitySuffix;

        String payload = buildPayload("Buildrr", body);

        for (PushSubscription sub : subscriptions) {
            if (sub.getUsuarioId().equals(req.getFromUserId())) continue;
            sendNotification(sub, payload);
        }
    }

    private void sendNotification(PushSubscription sub, String payload) {
        try {
            Notification notification = new Notification(sub.getEndpoint(), sub.getP256dh(), sub.getAuthKey(), payload);
            pushService.send(notification);
        } catch (Exception e) {
            log.warn("Error enviando push a endpoint {}: {}", sub.getEndpoint(), e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("410")) {
                sub.setActivo(false);
                repository.save(sub);
            }
        }
    }

    private String buildPayload(String title, String body) {
        String tag = "buildrr-" + System.currentTimeMillis();
        return "{\"notification\":{\"title\":\"" + escapeJson(title) + "\",\"body\":\"" + escapeJson(body)
                + "\",\"icon\":\"/buildr-icono.svg\",\"badge\":\"/buildr-icono.svg\",\"tag\":\"" + tag + "\"}}";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String translateEntity(String entity) {
        return switch (entity != null ? entity : "") {
            case "obra" -> "una obra";
            case "cliente" -> "un cliente";
            case "proveedor" -> "un proveedor";
            case "movimiento" -> "un movimiento";
            case "factura" -> "una factura";
            case "agenda" -> "una tarea en agenda";
            default -> "un registro";
        };
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }
}
