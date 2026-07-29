package com.auth.service;

import java.math.BigDecimal;

public interface ExchangeRateService {

    /**
     * Cotización actual USD → ARS (venta). Usa cache en memoria con TTL;
     * si el proveedor externo falla, cae a la última cotización cacheada
     * o al fallback configurado. Lanza IllegalStateException si no hay
     * ningún valor disponible.
     */
    BigDecimal getUsdToArsRate();
}
