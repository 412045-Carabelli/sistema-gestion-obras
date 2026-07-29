package com.obras.service.costo;

import com.obras.entity.Obra;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/** Costo ORIGINAL: subtotal es el costo real pagado al proveedor, el % de beneficio es el margen aplicado. */
public class OriginalCostoStrategy implements CostoTipoStrategy {

    @Override
    public BigDecimal subtotalEfectivo(BigDecimal subtotalBase) {
        return subtotalBase;
    }

    @Override
    public BigDecimal beneficioMonto(BigDecimal subtotalBase, BigDecimal beneficioPorcentaje, Obra obra) {
        BigDecimal pct = Boolean.TRUE.equals(obra.getBeneficioGlobal())
                ? Optional.ofNullable(obra.getBeneficio()).orElse(BigDecimal.ZERO)
                : Optional.ofNullable(beneficioPorcentaje).orElse(BigDecimal.ZERO);
        return subtotalBase.multiply(pct).divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
    }
}
