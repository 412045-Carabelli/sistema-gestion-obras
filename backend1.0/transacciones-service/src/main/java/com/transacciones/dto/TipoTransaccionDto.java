package com.transacciones.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoTransaccionDto {
    private Long id;
    private String nombre;
}
