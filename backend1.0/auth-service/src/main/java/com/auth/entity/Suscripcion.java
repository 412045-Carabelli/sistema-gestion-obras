package com.auth.entity;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "suscripciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Suscripcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizacionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "descuento_id")
    private Descuento descuento;

    @Column(nullable = false, length = 20)
    private String estado = "TRIAL";  // TRIAL | ACTIVA | VENCIDA | CANCELADA | SUSPENDIDA

    @Column(nullable = false, length = 10)
    private String ciclo = "MENSUAL";  // MENSUAL | ANUAL

    // Snapshot de precios al contratar
    @Column(name = "precio_base_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioBaseUsd;

    @Column(name = "descuento_aplicado_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal descuentoAplicadoUsd = BigDecimal.ZERO;

    @Column(name = "precio_final_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioFinalUsd;

    @Column(name = "fecha_inicio", nullable = false)
    private Instant fechaInicio;

    @Column(name = "fecha_vencimiento", nullable = false)
    private Instant fechaVencimiento;

    @Column(name = "fecha_cancelacion")
    private Instant fechaCancelacion;

    // Mercado Pago
    @Column(name = "mp_preapproval_id", length = 255)
    private String mpPreapprovalId;

    @Column(name = "mp_preapproval_plan_id", length = 255)
    private String mpPreapprovalPlanId;

    @Column(name = "mp_external_reference", length = 255)
    private String mpExternalReference;

    @Column(name = "mp_init_point", length = 1000)
    private String mpInitPoint;

    @Column(name = "mp_payment_id", length = 255)
    private String mpPaymentId;

    @Column(name = "mp_status", length = 50)
    private String mpStatus;

    @Column(name = "motivo_cancelacion", length = 500)
    private String motivoCancelacion;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "ultima_actualizacion")
    private Instant ultimaActualizacion;

    @PrePersist
    protected void onCreate() {
        this.creadoEn = Instant.now();
        if (this.fechaInicio == null) this.fechaInicio = Instant.now();
        if (this.descuentoAplicadoUsd == null) this.descuentoAplicadoUsd = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        this.ultimaActualizacion = Instant.now();
    }

    public boolean estaActiva() {
        return "ACTIVA".equals(this.estado) || "TRIAL".equals(this.estado);
    }

    public boolean estaVencida() {
        return Instant.now().isAfter(this.fechaVencimiento);
    }
}
