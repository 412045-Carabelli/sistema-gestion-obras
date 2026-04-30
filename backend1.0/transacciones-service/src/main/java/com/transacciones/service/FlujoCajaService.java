package com.transacciones.service;

import com.transacciones.dto.FlujoCajaDTO;

public interface FlujoCajaService {
    /**
     * Obtiene el flujo de caja principal (cobrado, por_cobrar, pagado, por_pagar, resultado).
     * Filtra solo obras en 6 estados: Adjudicada, En progreso, Cobrada, Facturada, Facturada parcial, Finalizada.
     * Ejecuta el SP sp_flujo_caja_principal.
     *
     * @return FlujoCajaDTO con: cobrado, por_cobrar, pagado, por_pagar, resultado
     */
    FlujoCajaDTO obtenerFlujoCajaPrincipal();
}
