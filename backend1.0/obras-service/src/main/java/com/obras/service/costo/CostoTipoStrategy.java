package com.obras.service.costo;

import com.obras.entity.Obra;

import java.math.BigDecimal;

public interface CostoTipoStrategy {

    default void validar(BigDecimal subtotalBase) {
    }

    BigDecimal subtotalEfectivo(BigDecimal subtotalBase);

    BigDecimal beneficioMonto(BigDecimal subtotalBase, BigDecimal beneficioPorcentaje, Obra obra);
}
