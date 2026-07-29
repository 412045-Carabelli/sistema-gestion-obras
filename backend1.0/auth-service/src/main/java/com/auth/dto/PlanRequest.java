package com.auth.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanRequest {

    @NotBlank(message = "Código requerido")
    private String codigo;

    @NotBlank(message = "Nombre requerido")
    private String nombre;

    private String descripcion;

    @NotNull(message = "Precio mensual requerido")
    @DecimalMin("0")
    private BigDecimal precioMensualUsd;

    @NotNull(message = "Precio anual requerido")
    @DecimalMin("0")
    private BigDecimal precioAnualUsd;

    // Límites (null = sin límite)
    private Integer maxUsuarios;
    private Integer maxObrasActivas;
    private Integer maxClientes;
    private Integer maxProveedores;
    private Integer maxTransaccionesMes;
    private Integer maxStorageMb;
    private Integer diasHistorialReportes;

    // Features
    private Boolean tieneFacturas = Boolean.FALSE;
    private Boolean tieneAgenda = Boolean.FALSE;
    private Boolean tieneGruposObras = Boolean.FALSE;
    private Boolean tieneExportar = Boolean.FALSE;
    private Boolean tienePushNotifications = Boolean.FALSE;
    private Boolean tieneSoportePrioritario = Boolean.FALSE;
    private Boolean tieneApiAccess = Boolean.FALSE;
}
