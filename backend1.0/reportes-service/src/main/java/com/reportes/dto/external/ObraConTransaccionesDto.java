package com.reportes.dto.external;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ObraConTransaccionesDto {
    private ObraExternalDto obra;
    private List<FacturaExternalDto> facturas = new ArrayList<>();
    private List<TransaccionExternalDto> transacciones = new ArrayList<>();
}
