package com.auth.dto;

import com.auth.entity.Plan;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlanResponse {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private BigDecimal precioMensualUsd;
    private BigDecimal precioAnualUsd;

    // Límites
    private Integer maxUsuarios;
    private Integer maxObrasActivas;
    private Integer maxClientes;
    private Integer maxProveedores;
    private Integer maxTransaccionesMes;
    private Integer maxStorageMb;
    private Integer diasHistorialReportes;

    // Features
    private Boolean tieneFacturas;
    private Boolean tieneAgenda;
    private Boolean tieneGruposObras;
    private Boolean tieneExportar;
    private Boolean tienePushNotifications;
    private Boolean tieneSoportePrioritario;
    private Boolean tieneApiAccess;
    private Boolean tieneWhatsappBot;
    private Boolean tieneGantt;

    private Boolean activo;
    private Instant creadoEn;

    public static PlanResponse from(Plan plan) {
        return PlanResponse.builder()
                .id(plan.getId())
                .codigo(plan.getCodigo())
                .nombre(plan.getNombre())
                .descripcion(plan.getDescripcion())
                .precioMensualUsd(plan.getPrecioMensualUsd())
                .precioAnualUsd(plan.getPrecioAnualUsd())
                .maxUsuarios(plan.getMaxUsuarios())
                .maxObrasActivas(plan.getMaxObrasActivas())
                .maxClientes(plan.getMaxClientes())
                .maxProveedores(plan.getMaxProveedores())
                .maxTransaccionesMes(plan.getMaxTransaccionesMes())
                .maxStorageMb(plan.getMaxStorageMb())
                .diasHistorialReportes(plan.getDiasHistorialReportes())
                .tieneFacturas(plan.getTieneFacturas())
                .tieneAgenda(plan.getTieneAgenda())
                .tieneGruposObras(plan.getTieneGruposObras())
                .tieneExportar(plan.getTieneExportar())
                .tienePushNotifications(plan.getTienePushNotifications())
                .tieneSoportePrioritario(plan.getTieneSoportePrioritario())
                .tieneApiAccess(plan.getTieneApiAccess())
                .tieneWhatsappBot(plan.getTieneWhatsappBot())
                .tieneGantt(plan.getTieneGantt())
                .activo(plan.getActivo())
                .creadoEn(plan.getCreadoEn())
                .build();
    }
}
