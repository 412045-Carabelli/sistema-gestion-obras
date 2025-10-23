package com.transacciones.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransaccionDto {
    private Long id;
    private Long id_obra;
    private Long id_asociado;
    private String tipo_asociado;
    private TipoTransaccionDto tipo_transaccion;
    private LocalDate fecha;
    private Double monto;
    private String forma_pago;
}
