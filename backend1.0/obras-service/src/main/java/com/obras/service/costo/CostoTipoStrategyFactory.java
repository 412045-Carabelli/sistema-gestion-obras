package com.obras.service.costo;

import com.obras.enums.TipoCostoEnum;

public final class CostoTipoStrategyFactory {

    private static final CostoTipoStrategy ORIGINAL = new OriginalCostoStrategy();
    private static final CostoTipoStrategy ADICIONAL_CON_PROVEEDOR = new AdicionalConProveedorCostoStrategy();
    private static final CostoTipoStrategy ADICIONAL_SIN_PROVEEDOR = new AdicionalSinProveedorCostoStrategy();
    private static final CostoTipoStrategy ECONOMIA = new EconomiaCostoStrategy();

    private CostoTipoStrategyFactory() {
    }

    public static CostoTipoStrategy obtener(TipoCostoEnum tipoCosto, Long idProveedor) {
        return switch (tipoCosto) {
            case ORIGINAL -> ORIGINAL;
            case ECONOMIA -> ECONOMIA;
            case ADICIONAL, AJUSTE -> idProveedor != null ? ADICIONAL_CON_PROVEEDOR : ADICIONAL_SIN_PROVEEDOR;
        };
    }
}
