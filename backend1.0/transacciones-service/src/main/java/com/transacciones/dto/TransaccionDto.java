package com.transacciones.dto;

import com.transacciones.enums.TipoTransaccionEnum;
import lombok.*;

import java.time.Instant;
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
    private TipoTransaccionEnum tipo_transaccion;
    private LocalDate fecha;
    private Double monto;
    private String forma_pago;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
}
