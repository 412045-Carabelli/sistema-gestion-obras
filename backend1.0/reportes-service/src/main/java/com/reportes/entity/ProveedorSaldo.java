package com.reportes.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "vw_saldos_proveedores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProveedorSaldo {
    @Id
    private Long id;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "total_costos")
    private BigDecimal totalCostos;

    @Column(name = "total_pagos")
    private BigDecimal totalPagos;

    @Column(name = "saldo_pendiente")
    private BigDecimal saldoPendiente;
}
