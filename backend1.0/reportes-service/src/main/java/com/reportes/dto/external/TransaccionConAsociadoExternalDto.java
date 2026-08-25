package com.reportes.dto.external;

import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
public class TransaccionConAsociadoExternalDto {
    private Long id;
    private Long id_obra;
    private String nombre_obra;
    private Long id_asociado;
    private String tipo_asociado;
    private String nombre_asociado;
    private String tipo_transaccion;
    private LocalDate fecha;
    private Double monto;
    private String forma_pago;
    private String medio_pago;
    private String concepto;
    private Boolean factura_cobrada;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
