package com.transacciones.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ObraCostoDto {
    private Long id;
    private Long id_obra;
    private Long id_proveedor;
    private Double cantidad;
    private Double precio_unitario;
    private Double subtotal;
    private Double total;
}
