package com.obras.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SaldoClienteDTO {
    private Long id;
    private String nombre;
    private Double total_presupuesto;
    private Double total_cobros;
    private Double saldo_pendiente;
}
