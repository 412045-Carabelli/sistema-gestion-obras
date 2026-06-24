package com.agendas.controller;

import com.common.dto.tareas.TareaRequest;
import com.common.dto.tareas.TareaResponse;
import com.common.dto.tareas.TareaAntiguaAgendaResponse;
import com.agendas.service.TareaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agenda/tareas")
@RequiredArgsConstructor
public class TareaController {

    private final TareaService service;

    @PostMapping
    public ResponseEntity<TareaResponse> crear(
            @RequestBody @Valid TareaRequest request,
            @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) {
        return ResponseEntity.ok(service.crear(request, organizacionId));
    }

    @GetMapping
    public List<TareaResponse> listar(
            @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) {
        return service.listar(organizacionId);
    }

    @GetMapping("/proveedor/{idProveedor}")
    public List<TareaResponse> obtenerTareasPorProveedor(@PathVariable("idProveedor") Long idProveedor) {
        return service.obtenerTareasPorProveedor(idProveedor);
    }

    @GetMapping("/antiguas")
    public List<TareaAntiguaAgendaResponse> obtenerTareasAntiguasAgenda(
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) {
        return service.obtenerTareasAntiguasAgendaEnriquecidas(limit, organizacionId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TareaResponse> obtener(@PathVariable("id") Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TareaResponse> actualizar(@PathVariable("id") Long id, @RequestBody @Valid TareaRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable("id") Long id) {
        service.eliminar(id);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<TareaResponse> cambiarEstado(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> request) {
        String nuevoEstado = request.get("estado");
        return ResponseEntity.ok(service.cambiarEstado(id, nuevoEstado));
    }
}
