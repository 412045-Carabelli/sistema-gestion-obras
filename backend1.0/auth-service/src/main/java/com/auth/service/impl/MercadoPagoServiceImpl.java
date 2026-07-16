package com.auth.service.impl;

import com.auth.dto.MpEstadoSuscripcionResponse;
import com.auth.dto.MpIniciarSuscripcionRequest;
import com.auth.dto.MpIniciarSuscripcionResponse;
import com.auth.entity.Descuento;
import com.auth.entity.Organizacion;
import com.auth.entity.Plan;
import com.auth.entity.Suscripcion;
import com.auth.exception.ResourceNotFoundException;
import com.auth.repository.DescuentoRepository;
import com.auth.repository.OrganizacionRepository;
import com.auth.repository.PlanRepository;
import com.auth.repository.SuscripcionRepository;
import com.auth.repository.UsuarioRepository;
import com.auth.service.ExchangeRateService;
import com.auth.service.MercadoPagoService;
import com.mercadopago.client.preapproval.PreApprovalAutoRecurringCreateRequest;
import com.mercadopago.client.preapproval.PreApprovalAutoRecurringUpdateRequest;
import com.mercadopago.client.preapproval.PreapprovalClient;
import com.mercadopago.client.preapproval.PreapprovalCreateRequest;
import com.mercadopago.client.preapproval.PreapprovalUpdateRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.preapproval.Preapproval;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MercadoPagoServiceImpl implements MercadoPagoService {

    private final PlanRepository planRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final DescuentoRepository descuentoRepository;
    private final OrganizacionRepository organizacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ExchangeRateService exchangeRateService;

    @Value("${mp.app-base-url:http://localhost:4200}")
    private String appBaseUrl;

    /** Moneda que usa MP para cobrar. ARS para Argentina, USD si la cuenta lo soporta. */
    @Value("${mp.currency-id:ARS}")
    private String currencyId;

    /** Override para sandbox: email de la cuenta compradora de prueba de MP. Dejar vacío en producción. */
    @Value("${mp.payer-email-override:}")
    private String payerEmailOverride;

    // -------------------------------------------------------------------------
    // iniciarSuscripcion
    // -------------------------------------------------------------------------

    @Override
    public MpIniciarSuscripcionResponse iniciarSuscripcion(Long organizacionId,
                                                            String username,
                                                            MpIniciarSuscripcionRequest request) {
        // 1. Resolver plan
        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan " + request.getPlanId() + " no existe"));

        String ciclo = request.getCiclo().toUpperCase();

        // Ciclo ANUAL deshabilitado: convertido a ARS supera el tope de MP para
        // preapproval (ARS 2.000.000) en todos los planes pagos a la cotización actual.
        if (!"MENSUAL".equals(ciclo)) {
            throw new IllegalArgumentException("Solo se admite ciclo MENSUAL para suscripciones vía Mercado Pago");
        }

        // 2. Resolver precio base y descuento
        BigDecimal precioBase = plan.getPrecioMensualUsd();
        BigDecimal descuentoMonto = BigDecimal.ZERO;
        Descuento descuentoEntidad = null;

        if (request.getCodigoDescuento() != null && !request.getCodigoDescuento().isBlank()) {
            descuentoEntidad = descuentoRepository.findByCodigo(request.getCodigoDescuento().toUpperCase())
                    .orElse(null);
            if (descuentoEntidad != null && descuentoEntidad.estaVigente()) {
                descuentoMonto = calcularDescuento(precioBase, descuentoEntidad);
            } else {
                descuentoEntidad = null;
            }
        }
        BigDecimal precioFinal = precioBase.subtract(descuentoMonto).max(BigDecimal.ZERO);

        // 2b. Convertir a ARS (MP Argentina cobra en pesos, no en el USD de referencia del plan)
        BigDecimal cotizacion = exchangeRateService.getUsdToArsRate();
        BigDecimal precioFinalArs = precioFinal.multiply(cotizacion).setScale(2, RoundingMode.HALF_UP);

        // 3. Cancelar suscripción activa anterior si existe (cambio de plan)
        suscripcionRepository.findActivaByOrganizacionId(organizacionId)
                .ifPresent(s -> {
                    if (s.getMpPreapprovalId() != null) {
                        cancelarEnMp(s.getMpPreapprovalId());
                    }
                    s.setEstado("CANCELADA");
                    s.setMotivoCancelacion("Nueva suscripción iniciada");
                    suscripcionRepository.save(s);
                });

        // 4. Obtener email del payer (requerido por MP)
        // En sandbox: usar override (debe ser email de cuenta compradora de prueba MP)
        // En producción: usar email real del usuario
        String payerEmail;
        if (payerEmailOverride != null && !payerEmailOverride.isBlank()) {
            payerEmail = payerEmailOverride;
        } else {
            payerEmail = usuarioRepository.findByUsername(username)
                    .map(u -> u.getEmail())
                    .filter(e -> e != null && !e.isBlank())
                    .orElseGet(() -> username != null && username.contains("@") ? username : null);
            if (payerEmail == null) {
                throw new ResourceNotFoundException("No se pudo determinar el email del usuario para Mercado Pago");
            }
        }

        // 5. Crear preapproval en MP con autoRecurring inline (monto ya convertido a ARS)
        String externalRef = "buildrr_org_" + organizacionId + "_" + System.currentTimeMillis();
        Preapproval preapproval = crearPreapprovalEnMp(plan, ciclo, precioFinalArs, externalRef, payerEmail);

        // 5. Persistir Suscripcion local con estado PENDIENTE_PAGO
        Instant ahora = Instant.now();
        Instant vencimiento = "MENSUAL".equals(ciclo)
                ? ahora.plus(32, ChronoUnit.DAYS)
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
                .cotizacionUsdArs(cotizacion)
                .precioFinalArs(precioFinalArs)
                .fechaInicio(ahora)
                .fechaVencimiento(vencimiento)
                .mpPreapprovalId(preapproval.getId())
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
                .montoArs(precioFinalArs)
                .cotizacionUsdArs(cotizacion)
                .build();
    }

    // -------------------------------------------------------------------------
    // consultarEstado
    // -------------------------------------------------------------------------

    @Override
    public MpEstadoSuscripcionResponse consultarEstado(Long organizacionId) {
        java.util.Optional<Suscripcion> optSuscripcion = suscripcionRepository
                .findUltimasVigentesByOrganizacionId(organizacionId)
                .stream().findFirst();

        if (optSuscripcion.isEmpty()) {
            // No hay suscripción vigente (todas canceladas o nunca suscripto)
            return MpEstadoSuscripcionResponse.builder()
                    .estadoLocal("SIN_SUSCRIPCION")
                    .sincronizado(true)
                    .build();
        }

        Suscripcion suscripcion = optSuscripcion.get();

        boolean tieneMp = suscripcion.getMpPreapprovalId() != null;
        String mpStatusActual = tieneMp ? sincronizarConMp(suscripcion) : null;
        boolean sincronizado = !tieneMp || mpStatusActual != null;

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

                            if ("authorized".equals(mpStatus) && !"ACTIVA".equals(estadoAnterior)) {
                                Instant ahora = Instant.now();
                                Instant nuevaFecha = "MENSUAL".equals(suscripcion.getCiclo())
                                        ? ahora.plus(32, ChronoUnit.DAYS)
                                        : ahora.plus(367, ChronoUnit.DAYS);
                                suscripcion.setFechaVencimiento(nuevaFecha);
                            }

                            suscripcionRepository.save(suscripcion);
                            // Actualizar plan en la organización cuando el pago es autorizado
                            if ("authorized".equals(mpStatus)) {
                                organizacionRepository.findById(suscripcion.getOrganizacionId()).ifPresent(org -> {
                                    org.setPlan(suscripcion.getPlan());
                                    organizacionRepository.save(org);
                                });
                            }
                            log.info("Webhook MP: preapproval={} mpStatus={} → localEstado={}", preapprovalId, mpStatus, nuevoEstado);
                        },
                        () -> log.warn("Webhook MP: preapproval {} no encontrado en DB", preapprovalId)
                );
    }

    // -------------------------------------------------------------------------
    // sincronizarPendientes
    // -------------------------------------------------------------------------

    @Override
    public void sincronizarPendientes() {
        var pendientes = suscripcionRepository.findByEstadoAndMpPreapprovalIdIsNotNull("PENDIENTE_PAGO");
        if (pendientes.isEmpty()) return;

        log.info("Sincronizando {} suscripción(es) PENDIENTE_PAGO contra MP", pendientes.size());
        for (Suscripcion s : pendientes) {
            sincronizarConMp(s);
        }
    }

    // -------------------------------------------------------------------------
    // helpers privados
    // -------------------------------------------------------------------------

    /**
     * Consulta el estado real de una suscripción en MP y actualiza estado/plan local si difiere.
     * Devuelve el mpStatus consultado, o null si no se pudo consultar (MP caído, etc).
     */
    private String sincronizarConMp(Suscripcion suscripcion) {
        if (suscripcion.getMpPreapprovalId() == null) return null;
        try {
            PreapprovalClient client = new PreapprovalClient();
            Preapproval mp = client.get(suscripcion.getMpPreapprovalId());
            String mpStatusActual = mp.getStatus();
            String estadoEsperado = mpStatusToLocal(mpStatusActual);

            if (!estadoEsperado.equals(suscripcion.getEstado())) {
                log.info("Auto-sincronizando: MP={} → local={} para suscripción {}",
                        mpStatusActual, estadoEsperado, suscripcion.getId());
                suscripcion.setMpStatus(mpStatusActual);
                suscripcion.setEstado(estadoEsperado);
                if ("authorized".equals(mpStatusActual) && suscripcion.getFechaVencimiento().isBefore(Instant.now())) {
                    Instant nuevaFecha = "MENSUAL".equals(suscripcion.getCiclo())
                            ? Instant.now().plus(32, ChronoUnit.DAYS)
                            : Instant.now().plus(367, ChronoUnit.DAYS);
                    suscripcion.setFechaVencimiento(nuevaFecha);
                }
                suscripcionRepository.save(suscripcion);
                // Actualizar plan en la organización para que mi-plan lo refleje
                if ("ACTIVA".equals(estadoEsperado)) {
                    organizacionRepository.findById(suscripcion.getOrganizacionId()).ifPresent(org -> {
                        org.setPlan(suscripcion.getPlan());
                        organizacionRepository.save(org);
                        log.info("Org {} actualizada a plan {}", suscripcion.getOrganizacionId(), suscripcion.getPlan().getCodigo());
                    });
                }
            }
            return mpStatusActual;
        } catch (MPException | MPApiException e) {
            log.warn("No se pudo consultar MP para suscripción {}: {}", suscripcion.getMpPreapprovalId(), e.getMessage());
            return null;
        }
    }

    private Preapproval crearPreapprovalEnMp(Plan plan, String ciclo, BigDecimal monto, String externalRef, String payerEmail) {
        try {
            // MENSUAL: cobro cada 1 mes  |  ANUAL: cobro cada 12 meses
            int frecuencia = "ANUAL".equals(ciclo) ? 12 : 1;

            OffsetDateTime inicio = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(5);

            PreApprovalAutoRecurringCreateRequest autoRecurring = PreApprovalAutoRecurringCreateRequest.builder()
                    .frequency(frecuencia)
                    .frequencyType("months")
                    .transactionAmount(monto)
                    .currencyId(currencyId)
                    .startDate(inicio)
                    .build();

            PreapprovalCreateRequest req = PreapprovalCreateRequest.builder()
                    .reason("Buildrr - Plan " + plan.getNombre() + " " + ciclo)
                    .externalReference(externalRef)
                    .payerEmail(payerEmail)
                    .backUrl(appBaseUrl + "/suscripcion/exito")
                    .autoRecurring(autoRecurring)
                    .build();

            PreapprovalClient client = new PreapprovalClient();
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
            PreapprovalClient client = new PreapprovalClient();
            PreapprovalUpdateRequest req = PreapprovalUpdateRequest.builder()
                    .status("cancelled")
                    .build();
            client.update(preapprovalId, req);
            log.info("Preapproval {} cancelado en MP", preapprovalId);
        } catch (MPException | MPApiException e) {
            log.warn("No se pudo cancelar preapproval {} en MP: {}", preapprovalId, e.getMessage());
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
        } else {
            return descuento.getValor().min(precio);
        }
    }
}
