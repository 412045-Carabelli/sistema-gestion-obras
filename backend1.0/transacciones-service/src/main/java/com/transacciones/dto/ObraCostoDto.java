package com.transacciones.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ObraCostoDto {
    private Long id;
    private Double subtotal;
    private Double total;
    private String estado_pago;
}
