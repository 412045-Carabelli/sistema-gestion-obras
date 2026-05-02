package com.transacciones.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MovimientoRecenteDTO {
    private Long id;
    private Long obraId;
    private String obraNombre;
    private Long asociadoId;
    private String asociadoTipo;
    private String asociadoNombre;
    private String tipoTransaccion;
    private LocalDate fecha;
    private Double monto;
    private String formaPago;
    private String medioPago;
    private String concepto;
}
