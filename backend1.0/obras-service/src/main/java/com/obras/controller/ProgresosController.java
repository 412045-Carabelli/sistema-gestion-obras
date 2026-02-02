package com.obras.controller;

import com.obras.dto.ProgresoDTO;
import com.obras.service.ProgresoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/obras/progreso")
@RequiredArgsConstructor
public class ProgresosController {
    private final ProgresoService svc;
    @GetMapping("/{idObra}") public ProgresoDTO progreso(@PathVariable("idObra") Long idObra){ return svc.calcularProgreso(idObra); }

}
