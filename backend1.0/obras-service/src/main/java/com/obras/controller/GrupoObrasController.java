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
  public ResponseEntity<GrupoObraDTO> crear(
      @RequestBody GrupoObraDTO dto,
      @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
    GrupoObraDTO created = service.crear(dto, organizacionId);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping
  public ResponseEntity<List<GrupoObraDTO>> listar(
      @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
    return ResponseEntity.ok(service.listar(organizacionId));
  }

  @GetMapping("/{id}")
  public ResponseEntity<GrupoObraDTO> obtenerPorId(@PathVariable Long id) {
    return ResponseEntity.ok(service.obtenerPorId(id));
  }

  @GetMapping("/cliente/{idCliente}")
  public ResponseEntity<List<GrupoObraDTO>> listarPorCliente(
      @PathVariable Long idCliente,
      @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
    return ResponseEntity.ok(service.listarPorCliente(idCliente, organizacionId));
  }

  @GetMapping("/cliente/{idCliente}/activos")
  public ResponseEntity<List<GrupoObraDTO>> listarActivosPorCliente(
      @PathVariable Long idCliente,
      @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
    return ResponseEntity.ok(service.listarActivosPorCliente(idCliente, organizacionId));
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
