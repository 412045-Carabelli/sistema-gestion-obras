package com.auth.controller;

import com.auth.dto.CreateUsuarioRequest;
import com.auth.dto.UpdateUsuarioRequest;
import com.auth.dto.UsuarioInfoResponse;
import com.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth/admin")
@RequiredArgsConstructor
public class AdminController {

  private final AuthService authService;

  @GetMapping("/usuarios")
  public ResponseEntity<List<UsuarioInfoResponse>> listarUsuarios(
      @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) {
    if (organizacionId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(authService.listarUsuariosOrganizacion(organizacionId));
  }

  @PostMapping("/usuarios")
  public ResponseEntity<UsuarioInfoResponse> crearUsuario(
      @Valid @RequestBody CreateUsuarioRequest request,
      @RequestHeader(value = "X-Organizacion-Id", required = false) Long empresaId) {
    if (empresaId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    UsuarioInfoResponse response = authService.crearUsuarioEnOrganizacion(empresaId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PutMapping("/usuarios/{id}")
  public ResponseEntity<UsuarioInfoResponse> actualizarUsuario(
      @PathVariable("id") Long id,
      @Valid @RequestBody UpdateUsuarioRequest request,
      @RequestHeader(value = "X-Organizacion-Id", required = false) Long empresaId) {
    if (empresaId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(authService.actualizarUsuario(empresaId, id, request));
  }

  @PatchMapping("/usuarios/{id}/estado")
  public ResponseEntity<UsuarioInfoResponse> cambiarEstado(
      @PathVariable("id") Long id,
      @RequestParam("activo") boolean activo,
      @RequestHeader(value = "X-Organizacion-Id", required = false) Long empresaId) {
    if (empresaId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(authService.cambiarEstadoUsuario(empresaId, id, activo));
  }
}
