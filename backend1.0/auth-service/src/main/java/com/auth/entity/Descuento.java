package com.auth.entity;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "descuentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Descuento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;  // ej: PROMO2025, LAUNCH50

    @Column(length = 255)
    private String descripcion;

    @Column(nullable = false, length = 20)
    private String tipo;  // PORCENTAJE | MONTO_FIJO

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    // null = aplica a todos los planes
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    // null = aplica a ambos ciclos
    @Column(name = "aplica_ciclo", length = 10)
    private String aplicaCiclo;  // MENSUAL | ANUAL | null

    @Column(name = "valido_desde", nullable = false)
    private Instant validoDesde;

    @Column(name = "valido_hasta")
    private Instant validoHasta;  // null = sin vencimiento

    @Column(name = "max_usos")
    private Integer maxUsos;  // null = ilimitados

    @Column(name = "usos_actuales", nullable = false)
    private Integer usosActuales = 0;

    @Column(name = "solo_primer_pago", nullable = false)
    private Boolean soloPrimerPago = Boolean.FALSE;

    @Column(nullable = false)
    private Boolean activo = Boolean.TRUE;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "creado_por", length = 100)
    private String creadoPor;

    @Column(name = "ultima_actualizacion")
    private Instant ultimaActualizacion;

    @PrePersist
    protected void onCreate() {
        this.creadoEn = Instant.now();
        if (this.validoDesde == null) this.validoDesde = Instant.now();
        if (this.usosActuales == null) this.usosActuales = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        this.ultimaActualizacion = Instant.now();
    }

    public boolean estaVigente() {
        Instant ahora = Instant.now();
        if (!Boolean.TRUE.equals(this.activo)) return false;
        if (this.validoHasta != null && ahora.isAfter(this.validoHasta)) return false;
        if (ahora.isBefore(this.validoDesde)) return false;
        if (this.maxUsos != null && this.usosActuales >= this.maxUsos) return false;
        return true;
    }
}
