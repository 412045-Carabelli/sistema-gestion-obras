package com.agendas.controller;

import com.agendas.scheduler.NotificacionAgendaScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/agenda/whatsapp")
@RequiredArgsConstructor
public class WhatsAppAgendaController {

    private final NotificacionAgendaScheduler scheduler;

    /**
     * Trigger manual: notifica tareas que vencen en las próximas 24h.
     */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> triggerNotificaciones() {
        int enviados = scheduler.ejecutarNotificaciones(24);
        return ResponseEntity.ok(Map.of(
            "ok", true,
            "enviados", enviados,
            "mensaje", enviados > 0
                ? enviados + " recordatorio(s) enviado(s) — tareas en las próximas 24h"
                : "Sin tareas por vencer en las próximas 24h"
        ));
    }

    /**
     * Trigger manual: resumen semanal de tareas que vencen en los próximos 7 días.
     */
    @PostMapping("/resumen-semanal")
    public ResponseEntity<Map<String, Object>> triggerResumenSemanal() {
        int enviados = scheduler.ejecutarResumenSemanal();
        return ResponseEntity.ok(Map.of(
            "ok", true,
            "enviados", enviados,
            "mensaje", enviados > 0
                ? enviados + " recordatorio(s) enviado(s) — tareas en los próximos 7 días"
                : "Sin tareas por vencer en los próximos 7 días"
        ));
    }
}
