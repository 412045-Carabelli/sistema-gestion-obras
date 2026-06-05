package com.agendas.scheduler;

import com.agendas.entity.EstadoTarea;
import com.agendas.entity.Tarea;
import com.agendas.repository.TareaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificacionAgendaScheduler {

    private final TareaRepository tareaRepository;
    private final RestTemplate restTemplate;

    @Value("${whatsapp.access-token}")
    private String accessToken;

    @Value("${whatsapp.phone-number-id}")
    private String phoneNumberId;

    @Value("${whatsapp.owner-phone}")
    private String ownerPhone;

    @Value("${whatsapp.template.agenda:sgo_recordatorio_agenda}")
    private String templateAgenda;

    @Value("${whatsapp.template.language:es_AR}")
    private String templateLanguage;

    @Value("${services.obras.url:http://obras-service:8081}")
    private String obrasServiceUrl;

    private static final String META_API_URL = "https://graph.facebook.com/v21.0";

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter
        .ofPattern("dd/MM/yyyy HH:mm")
        .withZone(ZoneId.of("America/Argentina/Buenos_Aires"));

    /**
     * Corre todos los días a las 8:00 AM (hora Argentina).
     * Busca tareas con fechaVencimiento en las próximas 24h y envía recordatorio al dueño.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "America/Argentina/Buenos_Aires")
    public void notificarVencimientosProximos() {
        if (accessToken == null || accessToken.isBlank() || ownerPhone == null || ownerPhone.isBlank()) {
            log.warn("WhatsApp no configurado — saltando notificaciones de agenda");
            return;
        }

        Instant ahora = Instant.now();
        Instant en24h = ahora.plusSeconds(86400L);

        List<Tarea> tareas = tareaRepository.findVencimientosProximos(ahora, en24h, EstadoTarea.COMPLETADA);

        if (tareas.isEmpty()) {
            log.info("Sin tareas por vencer en las próximas 24h");
            return;
        }

        log.info("Enviando {} recordatorios de agenda por WhatsApp", tareas.size());
        tareas.forEach(this::enviarRecordatorio);
    }

    private void enviarRecordatorio(Tarea tarea) {
        try {
            String obraNombre = obtenerNombreObra(tarea.getObraId());
            String fechaVencimiento = tarea.getFechaVencimiento() != null
                ? FORMATTER.format(tarea.getFechaVencimiento())
                : "Sin fecha";

            Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", ownerPhone,
                "type", "template",
                "template", Map.of(
                    "name", templateAgenda,
                    "language", Map.of("code", templateLanguage),
                    "components", List.of(Map.of(
                        "type", "body",
                        "parameters", List.of(
                            Map.of("type", "text", "text", tarea.getTitulo()),
                            Map.of("type", "text", "text", fechaVencimiento),
                            Map.of("type", "text", "text", obraNombre != null ? obraNombre : "Sin obra asignada"),
                            Map.of("type", "text", "text", tarea.getEstado().name())
                        )
                    ))
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForObject(META_API_URL + "/" + phoneNumberId + "/messages", entity, Map.class);

            log.info("Recordatorio enviado: tarea '{}' vence {}", tarea.getTitulo(), fechaVencimiento);
        } catch (Exception e) {
            log.error("Error enviando recordatorio para tarea {}: {}", tarea.getId(), e.getMessage());
        }
    }

    private String obtenerNombreObra(Long obraId) {
        if (obraId == null) return null;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                obrasServiceUrl + "/api/obras/{id}", Map.class, obraId);
            return response != null ? (String) response.get("nombre") : null;
        } catch (Exception e) {
            log.warn("No se pudo obtener nombre de obra {}: {}", obraId, e.getMessage());
            return null;
        }
    }
}
