package com.transacciones.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ComisionPagoRequest {
    private Double monto;
    private LocalDate fecha;
}
