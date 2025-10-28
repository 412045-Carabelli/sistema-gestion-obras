package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
public class TransaccionExternalDto {
    private Long id;
    @JsonProperty("id_obra")
    private Long idObra;
    @JsonProperty("id_asociado")
    private Long idAsociado;
    @JsonProperty("tipo_asociado")
    private String tipoAsociado;
    @JsonProperty("tipo_transaccion")
    private TipoTransaccionExternalDto tipoTransaccion;
    private LocalDate fecha;
    private Double monto;
    @JsonProperty("forma_pago")
    private String formaPago;
    private Boolean activo;
    @JsonProperty("ultima_actualizacion")
    private Instant ultimaActualizacion;
    @JsonProperty("tipo_actualizacion")
    private String tipoActualizacion;
}
