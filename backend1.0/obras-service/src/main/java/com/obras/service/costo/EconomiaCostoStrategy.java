package com.obras.service.costo;

import com.obras.entity.Obra;

import java.math.BigDecimal;

/** ECONOMIA: sin beneficio, resta directo del presupuesto. Requiere subtotal negativo. */
public class EconomiaCostoStrategy implements CostoTipoStrategy {

    @Override
    public void validar(BigDecimal subtotalBase) {
        if (subtotalBase.compareTo(BigDecimal.ZERO) >= 0) {
            throw new IllegalArgumentException("El monto de un costo ECONOMIA debe ser negativo (precio unitario < 0).");
        }
    }

    @Override
    public BigDecimal subtotalEfectivo(BigDecimal subtotalBase) {
        return subtotalBase;
    }

    @Override
    public BigDecimal beneficioMonto(BigDecimal subtotalBase, BigDecimal beneficioPorcentaje, Obra obra) {
        return BigDecimal.ZERO;
    }
}
