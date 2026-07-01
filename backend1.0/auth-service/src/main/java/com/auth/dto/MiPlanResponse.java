package com.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MiPlanResponse {

    // Plan actual
    private String planCodigo;
    private String planNombre;
    private BigDecimal precioMensualUsd;
    private BigDecimal precioAnualUsd;

    // Suscripción activa
    private String suscripcionEstado;   // TRIAL | ACTIVA | VENCIDA | CANCELADA
    private String ciclo;               // MENSUAL | ANUAL
    private Instant fechaVencimiento;
    private BigDecimal precioFinalUsd;

    // Límites (null = sin límite)
    private Integer maxUsuarios;
    private Integer maxObrasActivas;
    private Integer maxClientes;
    private Integer maxProveedores;
    private Integer maxTransaccionesMes;
    private Integer maxStorageMb;
    private Integer diasHistorialReportes;

    // Features habilitadas
    private List<String> featuresHabilitadas;

    // Flags individuales (para acceso directo en frontend)
    private Boolean tieneFacturas;
    private Boolean tieneAgenda;
    private Boolean tieneGruposObras;
    private Boolean tieneExportar;
    private Boolean tienePushNotifications;
    private Boolean tieneSoportePrioritario;
    private Boolean tieneApiAccess;
}
