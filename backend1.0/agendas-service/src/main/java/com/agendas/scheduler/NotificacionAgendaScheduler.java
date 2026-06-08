package com.agendas.scheduler;

import com.agendas.entity.EstadoTarea;
import com.agendas.entity.Tarea;
import com.agendas.repository.TareaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificacionAgendaScheduler {

    private final TareaRepository tareaRepository;
    private final RestTemplate restTemplate;

    @Value("${whatsapp.owner-phone:}")
    private String ownerPhone;

    @Value("${callmebot.api-key:}")
    private String callmebotApiKey;

    @Value("${services.obras.url:http://obras-service:8081}")
    private String obrasServiceUrl;

    private static final String CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";

    private static final Map<String, Integer> PRIORIDAD_ORDEN = Map.of(
        "ALTA", 0, "MEDIA", 1, "BAJA", 2
    );

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter
        .ofPattern("dd/MM/yyyy HH:mm")
        .withZone(ZoneId.of("America/Argentina/Buenos_Aires"));

    /**
     * Corre todos los días a las 8:00 AM (hora Argentina).
     * Busca tareas con fechaVencimiento en las próximas 24h.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "America/Argentina/Buenos_Aires")
    public void notificarVencimientosProximos() {
        ejecutarNotificaciones(24);
    }

    /**
     * Resumen semanal: todos los lunes a las 9:00 AM (hora Argentina).
     * Busca tareas que vencen en los próximos 7 días, ordenadas por prioridad.
     */
    @Scheduled(cron = "0 0 9 * * MON", zone = "America/Argentina/Buenos_Aires")
    public void resumenSemanal() {
        ejecutarResumenSemanal();
    }

    /**
     * Trigger manual: notifica vencimientos en la ventana indicada.
     * Tareas ordenadas por prioridad: ALTA primero, luego MEDIA, luego BAJA.
     *
     * @param horasVentana horas hacia adelante a buscar (ej: 24 para 1 día, 168 para 7 días)
     * @return cantidad de notificaciones enviadas
     */
    public int ejecutarNotificaciones(long horasVentana) {
        if (callmebotApiKey == null || callmebotApiKey.isBlank()) {
            log.warn("CallMeBot API key no configurada — saltando notificaciones de agenda");
            return 0;
        }

        String phone = resolverOwnerPhone();
        if (phone == null || phone.isBlank()) {
            log.warn("Teléfono de destino WhatsApp no configurado — no se enviarán notificaciones de agenda. " +
                "Configuralo en Ajustes > Configuración o en la variable de entorno WHATSAPP_OWNER_PHONE.");
            return 0;
        }

        Instant ahora = Instant.now();
        Instant hasta = ahora.plusSeconds(horasVentana * 3600L);

        log.info("[WA] Buscando tareas entre {} y {} ({}h)", ahora, hasta, horasVentana);
        log.info("[WA] Total tareas en BD: {}", tareaRepository.count());

        List<Tarea> tareas = tareaRepository.findVencimientosProximos(ahora, hasta, EstadoTarea.COMPLETADA);

        log.info("[WA] Tareas encontradas en rango (excluyendo COMPLETADA): {}", tareas.size());

        // Debug: mostrar todas las tareas con su fechaVencimiento y estado
        tareaRepository.findAll().forEach(t ->
            log.info("[WA] Tarea id={} titulo='{}' estado={} fechaVencimiento={} prioridad={}",
                t.getId(), t.getTitulo(), t.getEstado(), t.getFechaVencimiento(), t.getPrioridad())
        );

        if (tareas.isEmpty()) {
            log.info("Sin tareas por vencer en las próximas {}h", horasVentana);
            return 0;
        }

        List<Tarea> ordenadas = tareas.stream()
            .sorted(Comparator.comparingInt(t ->
                PRIORIDAD_ORDEN.getOrDefault(t.getPrioridad() != null ? t.getPrioridad() : "MEDIA", 1)
            ))
            .toList();

        log.info("Enviando {} recordatorios de agenda por WhatsApp a {} (ventana: {}h)", ordenadas.size(), phone, horasVentana);
        ordenadas.forEach(t -> enviarRecordatorio(t, phone));
        return ordenadas.size();
    }

    /**
     * Trigger manual para resumen semanal (próximos 7 días).
     *
     * @return cantidad de notificaciones enviadas
     */
    public int ejecutarResumenSemanal() {
        return ejecutarNotificaciones(168);
    }

    private void enviarRecordatorio(Tarea tarea, String phone) {
        try {
            String obraNombre = obtenerNombreObra(tarea.getObraId());
            String fechaVencimiento = tarea.getFechaVencimiento() != null
                ? FORMATTER.format(tarea.getFechaVencimiento())
                : "Sin fecha";

            String tituloConPrioridad = construirTituloConPrioridad(tarea.getTitulo(), tarea.getPrioridad());

            String mensaje = String.format(
                "📋 *SGO - Recordatorio de Tarea*\n\n" +
                "• Tarea: %s\n" +
                "• Vence: %s\n" +
                "• Obra: %s\n" +
                "• Estado: %s",
                tituloConPrioridad,
                fechaVencimiento,
                obraNombre != null ? obraNombre : "Sin obra asignada",
                tarea.getEstado().name()
            );

            URI uri = UriComponentsBuilder.fromHttpUrl(CALLMEBOT_URL)
                .queryParam("phone", phone)
                .queryParam("text", mensaje)
                .queryParam("apikey", callmebotApiKey)
                .build()
                .toUri();

            restTemplate.getForObject(uri, String.class);

            log.info("Recordatorio enviado via CallMeBot: tarea '{}' [{}] vence {}", tarea.getTitulo(), tarea.getPrioridad(), fechaVencimiento);
        } catch (Exception e) {
            log.error("Error enviando recordatorio para tarea {}: {}", tarea.getId(), e.getMessage());
        }
    }

    /**
     * Resuelve el teléfono de destino.
     * Primero lee la variable de entorno WHATSAPP_OWNER_PHONE.
     * Si está vacía, consulta la tabla app_config en obras-service.
     */
    private String resolverOwnerPhone() {
        if (ownerPhone != null && !ownerPhone.isBlank()) {
            return ownerPhone;
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> config = restTemplate.getForObject(
                obrasServiceUrl + "/api/configuracion", Map.class);
            if (config != null) {
                String phone = (String) config.get("whatsapp_owner_phone");
                if (phone != null && !phone.isBlank()) {
                    return phone;
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener teléfono WhatsApp desde configuración: {}", e.getMessage());
        }
        return null;
    }

    private String construirTituloConPrioridad(String titulo, String prioridad) {
        if ("ALTA".equals(prioridad)) {
            return "[URGENTE] " + titulo;
        }
        if ("BAJA".equals(prioridad)) {
            return titulo + " (baja prioridad)";
        }
        return titulo;
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
