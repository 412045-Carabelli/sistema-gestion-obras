package com.reportes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogoCuentaCorrienteResponse {
    private List<Map<String, Object>> obras;
    private List<Map<String, Object>> clientes;
    private List<Map<String, Object>> proveedores;
}
