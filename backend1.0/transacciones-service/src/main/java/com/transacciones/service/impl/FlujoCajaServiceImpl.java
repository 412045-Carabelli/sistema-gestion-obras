package com.transacciones.service.impl;

import com.transacciones.service.FlujoCajaService;
import com.transacciones.dto.FlujoCajaDTO;
import com.transacciones.repository.FlujoCajaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class FlujoCajaServiceImpl implements FlujoCajaService {

    private final FlujoCajaRepository flujoCajaRepository;

    /**
     * Obtiene el flujo de caja principal (cobrado, por_cobrar, pagado, por_pagar, resultado).
     * Filtra solo obras en 6 estados específicos: Adjudicada, En progreso, Cobrada, Facturada, Facturada parcial, Finalizada.
     *
     * @return FlujoCajaDTO con: cobrado, por_cobrar, pagado, por_pagar, resultado
     */
    @Override
    public FlujoCajaDTO obtenerFlujoCajaPrincipal() {
        try {
            return flujoCajaRepository.obtenerFlujoCajaPrincipal();
        } catch (Exception ex) {
            log.error("Error al calcular flujo de caja", ex);
            // Devolver valores por defecto en lugar de vacío
            return FlujoCajaDTO.builder()
                    .cobrado(BigDecimal.ZERO)
                    .por_cobrar(BigDecimal.ZERO)
                    .pagado(BigDecimal.ZERO)
                    .por_pagar(BigDecimal.ZERO)
                    .resultado(BigDecimal.ZERO)
                    .presupuesto_total(BigDecimal.ZERO)
                    .costos_total(BigDecimal.ZERO)
                    .build();
        }
    }
}
