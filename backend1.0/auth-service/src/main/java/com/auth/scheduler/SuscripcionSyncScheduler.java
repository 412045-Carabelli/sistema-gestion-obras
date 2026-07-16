package com.auth.scheduler;

import com.auth.service.MercadoPagoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SuscripcionSyncScheduler {

    private final MercadoPagoService mercadoPagoService;

    /**
     * Red de seguridad: sincroniza suscripciones PENDIENTE_PAGO contra MP cada 10 minutos,
     * por si el webhook no llegó (URL no configurada, entrega fallida) o el cliente nunca
     * volvió a la página de éxito.
     */
    @Scheduled(fixedDelay = 600_000, initialDelay = 60_000)
    public void sincronizarSuscripcionesPendientes() {
        try {
            mercadoPagoService.sincronizarPendientes();
        } catch (Exception e) {
            log.error("Error en sincronización programada de suscripciones pendientes", e);
        }
    }
}
