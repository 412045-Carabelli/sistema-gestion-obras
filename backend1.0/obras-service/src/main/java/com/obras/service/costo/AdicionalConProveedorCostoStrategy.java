package com.obras.service.costo;

import com.obras.entity.Obra;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/** ADICIONAL/AJUSTE con proveedor: hay un costo real de por medio, el % propio del costo es el margen. */
public class AdicionalConProveedorCostoStrategy implements CostoTipoStrategy {

    @Override
    public BigDecimal subtotalEfectivo(BigDecimal subtotalBase) {
        return subtotalBase;
    }

    @Override
    public BigDecimal beneficioMonto(BigDecimal subtotalBase, BigDecimal beneficioPorcentaje, Obra obra) {
        BigDecimal pct = Optional.ofNullable(beneficioPorcentaje).orElse(BigDecimal.ZERO);
        return subtotalBase.multiply(pct).divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
    }
}
