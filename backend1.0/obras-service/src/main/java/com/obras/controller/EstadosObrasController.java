package com.obras.controller;

import com.obras.dto.ObraEstadoDTO;
import com.obras.service.EstadoObraService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/obras/estados")
@RequiredArgsConstructor
public class EstadosObrasController {

    private final EstadoObraService svc;

    @GetMapping()
    public ResponseEntity<List<ObraEstadoDTO>> getEstados() {
        return ResponseEntity.ok(svc.listarEstados());
    }
}
