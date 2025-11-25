package com.reportes.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "comisiones")
public class Comision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_obra", nullable = false)
    private Long idObra;

    @Column(precision = 15, scale = 2)
    private BigDecimal monto;

    private LocalDate fecha;

    private Boolean pagado = Boolean.FALSE;
}
