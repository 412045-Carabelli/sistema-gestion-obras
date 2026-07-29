package com.obras.service.costo;

import com.obras.entity.Obra;

import java.math.BigDecimal;

/**
 * ADICIONAL/AJUSTE sin proveedor: no hay costo real a pagar, el monto cargado
 * es ganancia pura y debe imputarse directo al beneficio, no al costo.
 */
public class AdicionalSinProveedorCostoStrategy implements CostoTipoStrategy {

    @Override
    public BigDecimal subtotalEfectivo(BigDecimal subtotalBase) {
        return BigDecimal.ZERO;
    }

    @Override
    public BigDecimal beneficioMonto(BigDecimal subtotalBase, BigDecimal beneficioPorcentaje, Obra obra) {
        return subtotalBase;
    }
}
