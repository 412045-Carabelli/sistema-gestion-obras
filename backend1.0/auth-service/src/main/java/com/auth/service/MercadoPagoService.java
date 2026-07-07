package com.auth.service;

import com.auth.dto.MpEstadoSuscripcionResponse;
import com.auth.dto.MpIniciarSuscripcionRequest;
import com.auth.dto.MpIniciarSuscripcionResponse;

public interface MercadoPagoService {

    /**
     * Crea un preapproval en MP y una Suscripcion local con estado PENDIENTE_PAGO.
     * Devuelve el init_point para redirigir al usuario al checkout de MP.
     */
    MpIniciarSuscripcionResponse iniciarSuscripcion(Long organizacionId, MpIniciarSuscripcionRequest request);

    /**
     * Consulta el estado actual del preapproval en MP y sincroniza con DB si difiere.
     */
    MpEstadoSuscripcionResponse consultarEstado(Long organizacionId);

    /**
     * Cancela el preapproval en MP y marca la suscripcion local como CANCELADA.
     */
    void cancelarSuscripcion(Long organizacionId);

    /**
     * Procesa un evento de webhook de MP.
     * Valida la firma antes de llamar a este método.
     */
    void procesarWebhook(String preapprovalId, String mpStatus);
}
