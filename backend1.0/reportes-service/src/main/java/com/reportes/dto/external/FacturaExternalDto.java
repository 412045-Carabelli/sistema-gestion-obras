package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;

@Data
public class FacturaExternalDto {
    private Long id;
    @JsonProperty("id_cliente")
    private Long idCliente;
    @JsonProperty("id_obra")
    private Long idObra;
    private Double monto;
    @JsonProperty("monto_restante")
    private Double montoRestante;
    private LocalDate fecha;
    private String estado;
    private Boolean activo;
}
