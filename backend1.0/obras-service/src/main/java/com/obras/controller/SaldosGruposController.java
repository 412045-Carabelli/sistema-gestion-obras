package com.obras.controller;

import com.obras.dto.SaldoGrupoClienteDTO;
import com.obras.dto.SaldoGrupoProveedorDTO;
import com.obras.dto.ResumenObraClienteDTO;
import com.obras.dto.ResumenObraProveedorDTO;
import com.obras.service.SaldosGruposService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/saldos-grupos")
@RequiredArgsConstructor
public class SaldosGruposController {

  private final SaldosGruposService service;

  @GetMapping("/clientes")
  public ResponseEntity<List<SaldoGrupoClienteDTO>> obtenerSaldosGruposClientes() {
    return ResponseEntity.ok(service.obtenerSaldosGruposClientes());
  }

  @GetMapping("/proveedores")
  public ResponseEntity<List<SaldoGrupoProveedorDTO>> obtenerSaldosGruposProveedores() {
    return ResponseEntity.ok(service.obtenerSaldosGruposProveedores());
  }

  @GetMapping("/resumen-obras/clientes")
  public ResponseEntity<List<ResumenObraClienteDTO>> obtenerResumenObrasClientes() {
    return ResponseEntity.ok(service.obtenerResumenObrasClientes());
  }

  @GetMapping("/resumen-obras/proveedores")
  public ResponseEntity<List<ResumenObraProveedorDTO>> obtenerResumenObrasProveedores() {
    return ResponseEntity.ok(service.obtenerResumenObrasProveedores());
  }
}
