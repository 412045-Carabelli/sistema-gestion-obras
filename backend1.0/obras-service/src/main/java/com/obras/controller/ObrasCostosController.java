package com.obras.controller;

import com.obras.dto.ObraCostoDTO;
import com.obras.service.ObraCostoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/obras/costos")
@RequiredArgsConstructor
public class ObrasCostosController {

    private final ObraCostoService svc;

    @GetMapping("/{idObra}") public List<ObraCostoDTO> costos(@PathVariable("idObra") Long idObra){ return svc.listarPorObra(idObra); }
    @PostMapping("/{idObra}") public ObraCostoDTO addCosto(@PathVariable("idObra") Long idObra, @RequestBody ObraCostoDTO dto){ dto.setId_obra(idObra); return svc.crear(dto); }
    @PutMapping("/{id}/estado/{estado}")
    public ObraCostoDTO actualizarEstadoPago(
            @PathVariable("id") Long idCosto,
            @PathVariable("estado") com.obras.enums.EstadoPagoEnum estado) {
        return svc.actualizarEstadoPago(idCosto, estado);
    }

    @PutMapping("/{id}")
    public ObraCostoDTO actualizar(
            @PathVariable("id") Long idCosto,
            @RequestBody ObraCostoDTO dto) {
        return svc.actualizar(idCosto, dto);
    }

    @DeleteMapping("/{id}") public void delCosto(@PathVariable("id") Long id){ svc.eliminar(id); }

}
