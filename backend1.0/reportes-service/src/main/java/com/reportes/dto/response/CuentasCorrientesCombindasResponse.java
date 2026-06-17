package com.reportes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuentasCorrientesCombindasResponse {
    private List<CuentaCorrientePdfResponse> clientes = new ArrayList<>();
    private List<CuentaCorrientePdfResponse> proveedores = new ArrayList<>();
}
