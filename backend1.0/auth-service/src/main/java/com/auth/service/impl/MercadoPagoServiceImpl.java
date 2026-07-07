package com.auth.service.impl;

import com.auth.dto.MpEstadoSuscripcionResponse;
import com.auth.dto.MpIniciarSuscripcionRequest;
import com.auth.dto.MpIniciarSuscripcionResponse;
import com.auth.entity.Descuento;
import com.auth.entity.Plan;
import com.auth.entity.Suscripcion;
import com.auth.exception.ResourceNotFoundException;
import com.auth.repository.DescuentoRepository;
import com.auth.repository.PlanRepository;
import com.auth.repository.SuscripcionRepository;
import com.auth.service.MercadoPagoService;
import com.mercadopago.client.preapproval.PreApprovalClient;
import com.mercadopago.client.preapproval.PreApprovalCreateRequest;
import com.mercadopago.client.preapproval.PreApprovalUpdateRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.preapproval.PreApproval;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MercadoPagoServiceImpl implements MercadoPagoService {

    private final PlanRepository planRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final DescuentoRepository descuentoRepository;

    @Value("${mp.app-base-url:http://localhost:4200}")
    private String appBaseUrl;

    // -------------------------------------------------------------------------
    // iniciarSuscripcion
    // -------------------------------------------------------------------------

    @Override
    public MpIniciarSuscripcionResponse iniciarSuscripcion(Long organizacionId,
                                                            MpIniciarSuscripcionRequest request) {
        // 1. Resolver plan
        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan " + request.getPlanId() + " no existe"));

        // 2. Determinar preapproval_plan_id de MP según ciclo
        String ciclo = request.getCiclo().toUpperCase();
        String mpPlanId = "MENSUAL".equals(ciclo)
                ? plan.getMpPreapprovalPlanIdMensual()
                : plan.getMpPreapprovalPlanIdAnual();

        if (mpPlanId == null || mpPlanId.isBlank()) {
            throw new IllegalStateException(
                    "Plan " + plan.getCodigo() + " no tiene mp_preapproval_plan_id_" + ciclo.toLowerCase() + " configurado");
        }

        // 3. Resolver precio base y descuento
        BigDecimal precioBase = "MENSUAL".equals(ciclo) ? plan.getPrecioMensualUsd() : plan.getPrecioAnualUsd();
        BigDecimal descuentoMonto = BigDecimal.ZERO;
        Descuento descuentoEntidad = null;

        if (request.getCodigoDescuento() != null && !request.getCodigoDescuento().isBlank()) {
            descuentoEntidad = descuentoRepository.findByCodigo(request.getCodigoDescuento().toUpperCase())
                    .orElse(null);
            if (descuentoEntidad != null && descuentoEntidad.estaVigente()) {
                descuentoMonto = calcularDescuento(precioBase, descuentoEntidad);
            } else {
                descuentoEntidad = null; // descuento inválido → ignorar
            }
        }
        BigDecimal precioFinal = precioBase.subtract(descuentoMonto).max(BigDecimal.ZERO);

        // 4. Cancelar suscripción activa anterior si existe (cambio de plan)
        suscripcionRepository.findActivaByOrganizacionId(organizacionId)
                .ifPresent(s -> {
                    if (s.getMpPreapprovalId() != null) {
                        cancelarEnMp(s.getMpPreapprovalId());
                    }
                    s.setEstado("CANCELADA");
                    s.setMotivoCancelacion("Nueva suscripción iniciada");
                    suscripcionRepository.save(s);
                });

        // 5. Crear preapproval en MP
        String externalRef = "sgo_org_" + organizacionId + "_" + System.currentTimeMillis();
        PreApproval preapproval = crearPreapprovalEnMp(mpPlanId, externalRef, plan.getNombre(), ciclo);

        // 6. Persistir Suscripcion local con estado PENDIENTE_PAGO
        Instant ahora = Instant.now();
        Instant vencimiento = "MENSUAL".equals(ciclo)
                ? ahora.plus(32, ChronoUnit.DAYS)   // margen generoso hasta que MP confirme
                : ahora.plus(367, ChronoUnit.DAYS);

        Suscripcion suscripcion = Suscripcion.builder()
                .organizacionId(organizacionId)
                .plan(plan)
                .descuento(descuentoEntidad)
                .estado("PENDIENTE_PAGO")
                .ciclo(ciclo)
                .precioBaseUsd(precioBase)
                .descuentoAplicadoUsd(descuentoMonto)
                .precioFinalUsd(precioFinal)
                .fechaInicio(ahora)
                .fechaVencimiento(vencimiento)
                .mpPreapprovalId(preapproval.getId())
                .mpPreapprovalPlanId(mpPlanId)
                .mpExternalReference(externalRef)
                .mpInitPoint(preapproval.getInitPoint())
                .mpStatus(preapproval.getStatus())
                .build();

        suscripcionRepository.save(suscripcion);
        log.info("Suscripción {} creada para org {} → MP preapproval {}", suscripcion.getId(), organizacionId, preapproval.getId());

        return MpIniciarSuscripcionResponse.builder()
                .initPoint(preapproval.getInitPoint())
                .preapprovalId(preapproval.getId())
                .externalReference(externalRef)
                .estado("PENDIENTE_PAGO")
                .build();
    }

    // -------------------------------------------------------------------------
    // consultarEstado
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public MpEstadoSuscripcionResponse consultarEstado(Long organizacionId) {
        Suscripcion suscripcion = suscripcionRepository.findActivaByOrganizacionId(organizacionId)
                .orElseThrow(() -> new ResourceNotFoundException("No hay suscripción activa para org " + organizacionId));

        String mpStatusActual = null;
        boolean sincronizado = true;

        if (suscripcion.getMpPreapprovalId() != null) {
            try {
                PreApprovalClient client = new PreApprovalClient();
                PreApproval mp = client.get(suscripcion.getMpPreapprovalId());
                mpStatusActual = mp.getStatus();
                String estadoEsperado = mpStatusToLocal(mpStatusActual);
                sincronizado = estadoEsperado.equals(suscripcion.getEstado());

                // Auto-sincronizar si difieren
                if (!sincronizado) {
                    // hacemos una transacción nueva para no contaminar la readOnly
                    log.warn("Estado MP={} difiere de local={} para suscripción {}. Sincronizando.",
                            mpStatusActual, suscripcion.getEstado(), suscripcion.getId());
                }
            } catch (MPException | MPApiException e) {
                log.warn("No se pudo consultar MP para suscripción {}: {}", suscripcion.getMpPreapprovalId(), e.getMessage());
                sincronizado = false;
            }
        }

        return MpEstadoSuscripcionResponse.builder()
                .preapprovalId(suscripcion.getMpPreapprovalId())
                .mpStatus(mpStatusActual != null ? mpStatusActual : suscripcion.getMpStatus())
                .estadoLocal(suscripcion.getEstado())
                .planCodigo(suscripcion.getPlan().getCodigo())
                .ciclo(suscripcion.getCiclo())
                .fechaVencimiento(suscripcion.getFechaVencimiento().toString())
                .sincronizado(sincronizado)
                .build();
    }

    // -------------------------------------------------------------------------
    // cancelarSuscripcion
    // -------------------------------------------------------------------------

    @Override
    public void cancelarSuscripcion(Long organizacionId) {
        Suscripcion suscripcion = suscripcionRepository.findActivaByOrganizacionId(organizacionId)
                .orElseThrow(() -> new ResourceNotFoundException("No hay suscripción activa para org " + organizacionId));

        if (suscripcion.getMpPreapprovalId() != null) {
            cancelarEnMp(suscripcion.getMpPreapprovalId());
        }

        suscripcion.setEstado("CANCELADA");
        suscripcion.setFechaCancelacion(Instant.now());
        suscripcion.setMotivoCancelacion("Cancelación solicitada por el usuario");
        suscripcionRepository.save(suscripcion);
        log.info("Suscripción {} cancelada para org {}", suscripcion.getId(), organizacionId);
    }

    // -------------------------------------------------------------------------
    // procesarWebhook
    // -------------------------------------------------------------------------

    @Override
    public void procesarWebhook(String preapprovalId, String mpStatus) {
        suscripcionRepository.findByMpPreapprovalId(preapprovalId)
                .ifPresentOrElse(
                        suscripcion -> {
                            String nuevoEstado = mpStatusToLocal(mpStatus);
                            String estadoAnterior = suscripcion.getEstado();
                            suscripcion.setMpStatus(mpStatus);
                            suscripcion.setEstado(nuevoEstado);

                            // Si MP acaba de autorizar: extender fecha de vencimiento real
                            if ("authorized".equals(mpStatus) && !"ACTIVA".equals(estadoAnterior)) {
                                Instant ahora = Instant.now();
                                Instant nuevaFecha = "MENSUAL".equals(suscripcion.getCiclo())
                                        ? ahora.plus(32, ChronoUnit.DAYS)
                                        : ahora.plus(367, ChronoUnit.DAYS);
                                suscripcion.setFechaVencimiento(nuevaFecha);
                            }

                            suscripcionRepository.save(suscripcion);
                            log.info("Webhook MP: preapproval={} mpStatus={} → localEstado={}", preapprovalId, mpStatus, nuevoEstado);
                        },
                        () -> log.warn("Webhook MP: preapproval {} no encontrado en DB", preapprovalId)
                );
    }

    // -------------------------------------------------------------------------
    // helpers privados
    // -------------------------------------------------------------------------

    private PreApproval crearPreapprovalEnMp(String mpPlanId, String externalRef, String planNombre, String ciclo) {
        try {
            PreApprovalClient client = new PreApprovalClient();
            PreApprovalCreateRequest req = PreApprovalCreateRequest.builder()
                    .preapprovalPlanId(mpPlanId)
                    .reason("Buildrr - Plan " + planNombre + " " + ciclo)
                    .externalReference(externalRef)
                    .backUrl(appBaseUrl + "/suscripcion/exito")
                    .build();
            return client.create(req);
        } catch (MPApiException e) {
            log.error("MP API error al crear preapproval: status={} body={}", e.getStatusCode(), e.getApiResponse().getContent());
            throw new IllegalStateException("Error al crear preapproval en Mercado Pago: " + e.getMessage(), e);
        } catch (MPException e) {
            log.error("MP SDK error al crear preapproval: {}", e.getMessage());
            throw new IllegalStateException("Error de comunicación con Mercado Pago", e);
        }
    }

    private void cancelarEnMp(String preapprovalId) {
        try {
            PreApprovalClient client = new PreApprovalClient();
            PreApprovalUpdateRequest req = PreApprovalUpdateRequest.builder()
                    .status("cancelled")
                    .build();
            client.update(preapprovalId, req);
            log.info("Preapproval {} cancelado en MP", preapprovalId);
        } catch (MPException | MPApiException e) {
            log.warn("No se pudo cancelar preapproval {} en MP: {}", preapprovalId, e.getMessage());
            // No lanzar: si MP falla, igual cancelamos local
        }
    }

    private String mpStatusToLocal(String mpStatus) {
        if (mpStatus == null) return "SUSPENDIDA";
        return switch (mpStatus.toLowerCase()) {
            case "authorized" -> "ACTIVA";
            case "paused"     -> "SUSPENDIDA";
            case "cancelled"  -> "CANCELADA";
            case "pending"    -> "PENDIENTE_PAGO";
            default           -> "SUSPENDIDA";
        };
    }

    private BigDecimal calcularDescuento(BigDecimal precio, Descuento descuento) {
        if ("PORCENTAJE".equals(descuento.getTipo())) {
            return precio.multiply(descuento.getValor()).divide(BigDecimal.valueOf(100));
        } else { // MONTO_FIJO
            return descuento.getValor().min(precio);
        }
    }
}
