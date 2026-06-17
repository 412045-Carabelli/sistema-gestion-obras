package com.obras.controller;

import com.obras.dto.GrupoObraDTO;
import com.obras.service.GrupoObrasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grupos-obras")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GrupoObrasController {

  private final GrupoObrasService service;

  @PostMapping
  public ResponseEntity<GrupoObraDTO> crear(@RequestBody GrupoObraDTO dto) {
    GrupoObraDTO created = service.crear(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping
  public ResponseEntity<List<GrupoObraDTO>> listar() {
    return ResponseEntity.ok(service.listar());
  }

  @GetMapping("/{id}")
  public ResponseEntity<GrupoObraDTO> obtenerPorId(@PathVariable Long id) {
    return ResponseEntity.ok(service.obtenerPorId(id));
  }

  @GetMapping("/cliente/{idCliente}")
  public ResponseEntity<List<GrupoObraDTO>> listarPorCliente(@PathVariable Long idCliente) {
    return ResponseEntity.ok(service.listarPorCliente(idCliente));
  }

  @GetMapping("/cliente/{idCliente}/activos")
  public ResponseEntity<List<GrupoObraDTO>> listarActivosPorCliente(@PathVariable Long idCliente) {
    return ResponseEntity.ok(service.listarActivosPorCliente(idCliente));
  }

  @PutMapping("/{id}")
  public ResponseEntity<GrupoObraDTO> actualizar(
      @PathVariable Long id,
      @RequestBody GrupoObraDTO dto) {
    return ResponseEntity.ok(service.actualizar(id, dto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> eliminar(@PathVariable Long id) {
    service.eliminar(id);
    return ResponseEntity.noContent().build();
  }
}
