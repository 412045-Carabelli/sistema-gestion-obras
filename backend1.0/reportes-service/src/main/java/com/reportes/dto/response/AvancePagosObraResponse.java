package com.reportes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvancePagosObraResponse {
    private List<ItemAvancePago> items = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemAvancePago {
        private Long proveedorId;
        private String proveedorNombre;
        private BigDecimal costoTotal;
        private BigDecimal avancePorcentaje;
        private BigDecimal pagoHabilitado;
        private BigDecimal pagado;
        private BigDecimal saldo;
        private String estadoPago; // AL_DIA, ATRASADO, ADELANTADO, SIN_MOVIMIENTO
    }
}
