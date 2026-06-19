package com.obras.controller;

import com.obras.dto.SaldoGrupoClienteDTO;
import com.obras.dto.SaldoGrupoProveedorDTO;
import com.obras.dto.ResumenObraClienteDTO;
import com.obras.dto.ResumenObraProveedorDTO;
import com.obras.service.SaldosGruposService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/saldos-grupos")
@RequiredArgsConstructor
public class SaldosGruposController {

  private final SaldosGruposService service;

  @GetMapping("/clientes")
  public ResponseEntity<List<SaldoGrupoClienteDTO>> obtenerSaldosGruposClientes(
          @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
    return ResponseEntity.ok(service.obtenerSaldosGruposClientes(organizacionId));
  }

  @GetMapping("/proveedores")
  public ResponseEntity<List<SaldoGrupoProveedorDTO>> obtenerSaldosGruposProveedores(
          @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
    return ResponseEntity.ok(service.obtenerSaldosGruposProveedores(organizacionId));
  }

  @GetMapping("/resumen-obras/clientes")
  public ResponseEntity<List<ResumenObraClienteDTO>> obtenerResumenObrasClientes(
          @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
    return ResponseEntity.ok(service.obtenerResumenObrasClientes(organizacionId));
  }

  @GetMapping("/resumen-obras/proveedores")
  public ResponseEntity<List<ResumenObraProveedorDTO>> obtenerResumenObrasProveedores(
          @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
    return ResponseEntity.ok(service.obtenerResumenObrasProveedores(organizacionId));
  }
}
