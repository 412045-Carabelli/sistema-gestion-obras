package com.apigateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushTriggerService {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.auth.url:http://localhost:8089}")
    private String authServiceUrl;

    @Value("${push.internal.secret:push-internal-secret-2024}")
    private String internalSecret;

    public void triggerNotification(Long organizacionId, Long fromUserId, String fromUsername,
                                    String entity, String entityName) {
        if (organizacionId == null) return;

        Map<String, Object> payload = Map.of(
                "organizacionId", organizacionId,
                "fromUserId", fromUserId != null ? fromUserId : 0L,
                "fromUsername", fromUsername != null ? fromUsername : "Usuario",
                "entity", entity,
                "entityName", entityName != null ? entityName : ""
        );

        webClientBuilder.build()
                .post()
                .uri(authServiceUrl + "/push/notify")
                .header("X-Internal-Secret", internalSecret)
                .header("Content-Type", "application/json")
                .bodyValue(payload)
                .retrieve()
                .toBodilessEntity()
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        ok -> log.debug("Push trigger OK: {} -> org {}", entity, organizacionId),
                        err -> log.warn("Push trigger falló: {}", err.getMessage())
                );
    }
}
