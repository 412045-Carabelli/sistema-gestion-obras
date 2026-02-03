package com.clientes.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TransaccionExternalDto {
    private Long id_obra;
    private String tipo_transaccion;
    private Double monto;
    private Boolean activo;
}
