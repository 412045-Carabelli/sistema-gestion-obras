package com.obras.controller;

import com.obras.dto.EstadoTareaDTO;
import com.obras.dto.ObraEstadoDTO;
import com.obras.service.EstadoObraService;
import com.obras.service.EstadosTareasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/obras/estados-tareas")
@RequiredArgsConstructor
public class EstadosTareasController {

    private final EstadosTareasService svc;

    @GetMapping()
    public ResponseEntity<List<EstadoTareaDTO>> getEstados() {
        return ResponseEntity.ok(svc.listarEstados());
    }
}