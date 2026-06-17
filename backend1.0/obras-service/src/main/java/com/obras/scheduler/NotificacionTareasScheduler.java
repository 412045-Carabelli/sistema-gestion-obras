package com.obras.scheduler;

import com.obras.entity.Tarea;
import com.obras.enums.EstadoTareaEnum;
import com.obras.repository.TareaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificacionTareasScheduler {

    private final TareaRepository tareaRepository;
    private final RestTemplate restTemplate;

    @Value("${whatsapp.access-token:}")
    private String accessToken;

    @Value("${whatsapp.phone-number-id:}")
    private String phoneNumberId;

    @Value("${whatsapp.owner-phone:}")
    private String ownerPhone;

    private static final String META_API_URL = "https://graph.facebook.com/v21.0";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Corre todos los días a las 8:00 AM (hora Argentina).
     * Busca tareas de obras con fechaFin en las próximas 24h y envía notificación por WhatsApp.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "America/Argentina/Buenos_Aires")
    public void notificarTareasProximas() {
        if (accessToken == null || accessToken.isBlank() || ownerPhone == null || ownerPhone.isBlank()) {
            log.warn("WhatsApp no configurado — saltando notificaciones de tareas de obras");
            return;
        }

        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime en24h = ahora.plusHours(24);

        List<Tarea> tareas = tareaRepository.findVencimientosProximos(ahora, en24h, EstadoTareaEnum.COMPLETADA);

        if (tareas.isEmpty()) {
            log.info("Sin tareas de obras por vencer en las próximas 24h");
            return;
        }

        log.info("Enviando {} notificaciones de tareas de obras por WhatsApp", tareas.size());
        tareas.forEach(this::enviarNotificacion);
    }

    private void enviarNotificacion(Tarea tarea) {
        try {
            String fechaFin = tarea.getFechaFin() != null
                ? FORMATTER.format(tarea.getFechaFin())
                : "Sin fecha";

            String texto = String.format(
                "⚠️ Tarea por vencer\n🔨 %s\n📅 Vence: %s\n📊 Progreso: %.0f%%\n🏗️ Obra ID: %d",
                tarea.getNombre(),
                fechaFin,
                tarea.getPorcentaje(),
                tarea.getIdObra()
            );

            Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", ownerPhone,
                "type", "text",
                "text", Map.of("body", texto, "preview_url", false)
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForObject(META_API_URL + "/" + phoneNumberId + "/messages", entity, Map.class);

            log.info("Notificación enviada: tarea '{}' vence {}", tarea.getNombre(), fechaFin);
        } catch (Exception e) {
            log.error("Error enviando notificación para tarea {}: {}", tarea.getId(), e.getMessage());
        }
    }
}
