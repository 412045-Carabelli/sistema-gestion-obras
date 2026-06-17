package com.transacciones.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.transacciones.enums.TipoTransaccionEnum;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TransaccionConAsociadoDto {
    private Long id;
    private Long id_obra;
    private String nombre_obra;
    private Long id_asociado;
    private String tipo_asociado;
    private String nombre_asociado;
    private TipoTransaccionEnum tipo_transaccion;
    private LocalDate fecha;
    private Double monto;
    private String forma_pago;
    private String medio_pago;
    private String concepto;
    private Boolean factura_cobrada;
    private Boolean activo;
    private Instant ultima_actualizacion;
    private String tipo_actualizacion;
    private Double pagado;
    private Double restante;
}
