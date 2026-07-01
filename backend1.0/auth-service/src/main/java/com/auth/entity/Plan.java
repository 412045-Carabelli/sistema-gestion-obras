package com.auth.entity;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "planes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;  // FREE, BASICO, PROFESIONAL, ENTERPRISE

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(name = "precio_mensual_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioMensualUsd;

    @Column(name = "precio_anual_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioAnualUsd;

    // Límites (null = sin límite)
    @Column(name = "max_usuarios")
    private Integer maxUsuarios;

    @Column(name = "max_obras_activas")
    private Integer maxObrasActivas;

    @Column(name = "max_clientes")
    private Integer maxClientes;

    @Column(name = "max_proveedores")
    private Integer maxProveedores;

    @Column(name = "max_transacciones_mes")
    private Integer maxTransaccionesMes;

    @Column(name = "max_storage_mb")
    private Integer maxStorageMb;

    @Column(name = "dias_historial_reportes")
    private Integer diasHistorialReportes;  // null = ∞, 0 = sin acceso, 30 = últimos 30 días

    // Feature flags
    @Column(name = "tiene_facturas", nullable = false)
    private Boolean tieneFacturas = Boolean.FALSE;

    @Column(name = "tiene_agenda", nullable = false)
    private Boolean tieneAgenda = Boolean.FALSE;

    @Column(name = "tiene_grupos_obras", nullable = false)
    private Boolean tieneGruposObras = Boolean.FALSE;

    @Column(name = "tiene_exportar", nullable = false)
    private Boolean tieneExportar = Boolean.FALSE;

    @Column(name = "tiene_push_notifications", nullable = false)
    private Boolean tienePushNotifications = Boolean.FALSE;

    @Column(name = "tiene_soporte_prioritario", nullable = false)
    private Boolean tieneSoportePrioritario = Boolean.FALSE;

    @Column(name = "tiene_api_access", nullable = false)
    private Boolean tieneApiAccess = Boolean.FALSE;

    @Column(nullable = false)
    private Boolean activo = Boolean.TRUE;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "ultima_actualizacion")
    private Instant ultimaActualizacion;

    @PrePersist
    protected void onCreate() {
        this.creadoEn = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ultimaActualizacion = Instant.now();
    }
}
