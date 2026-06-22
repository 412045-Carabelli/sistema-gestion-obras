package com.auth.controller;

import com.auth.dto.PushNotifyRequest;
import com.auth.dto.PushSubscriptionRequest;
import com.auth.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/push")
@RequiredArgsConstructor
@Slf4j
public class PushController {

    private final PushNotificationService pushService;

    @Value("${push.internal.secret}")
    private String internalSecret;

    @GetMapping("/vapid-key")
    public ResponseEntity<Map<String, String>> getVapidKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushService.getVapidPublicKey()));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organizacion-Id") Long organizacionId,
            @RequestBody PushSubscriptionRequest req) {
        pushService.subscribe(userId, organizacionId, req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, String> body) {
        pushService.unsubscribe(userId, body.get("endpoint"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notify")
    public ResponseEntity<Void> notify(
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret,
            @RequestBody PushNotifyRequest req) {
        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(403).build();
        }
        pushService.notifyAdmins(req);
        return ResponseEntity.ok().build();
    }
}
