package com.transacciones.controller;

import com.transacciones.service.FlujoCajaService;
import com.transacciones.dto.FlujoCajaDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/flujo-caja")
@RequiredArgsConstructor
public class FlujoCajaController {

    private final FlujoCajaService flujoCajaService;

    /**
     * Obtiene el flujo de caja principal (cobrado, por_cobrar, pagado, por_pagar, resultado).
     * Filtra solo obras en 6 estados: Adjudicada, En progreso, Cobrada, Facturada, Facturada parcial, Finalizada.
     * Endpoint: GET /api/flujo-caja/principal
     *
     * Respuesta:
     * {
     *   "cobrado": 50000.00,
     *   "por_cobrar": 30000.00,
     *   "pagado": 40000.00,
     *   "por_pagar": 20000.00,
     *   "resultado": 10000.00
     * }
     *
     * @return FlujoCajaDTO con: cobrado, por_cobrar, pagado, por_pagar, resultado
     */
    @GetMapping("/principal")
    public ResponseEntity<FlujoCajaDTO> obtenerFlujoCajaPrincipal() {
        return ResponseEntity.ok(flujoCajaService.obtenerFlujoCajaPrincipal());
    }
}
