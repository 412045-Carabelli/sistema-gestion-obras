package com.reportes.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "movimientos_reporte")
public class MovimientoReporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String referencia;

    @Column(precision = 15, scale = 2)
    private BigDecimal monto;

    private LocalDate fecha;

    private String tipo;
}
