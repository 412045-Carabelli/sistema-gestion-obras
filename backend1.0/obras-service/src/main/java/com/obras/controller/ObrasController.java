package com.obras.controller;

import com.obras.dto.*;
import com.obras.entity.ObraProveedor;
import com.obras.enums.EstadoObraEnum;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.obras.service.ObraService;
import java.util.*;

@RestController
@RequestMapping("/api/obras")
@RequiredArgsConstructor
public class ObrasController {

    private final ObraService svc;

    // OBRAS
    @PostMapping
    public ResponseEntity<ObraDTO> crear(
            @Valid @RequestBody ObraDTO dto,
            @RequestHeader(value = "X-Empresa-Id", required = false) Long empresaId) {
        return ResponseEntity.ok(svc.crear(dto, empresaId));
    }
    @GetMapping("/condiciones/ultima")
    public ResponseEntity<ObraDTO> getUltimaCondicion() {
        return svc.obtenerUltimaCondicion()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
    @GetMapping("/{id}") public ResponseEntity<ObraDTO> get(@PathVariable("id") Long id){ return svc.obtener(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @GetMapping
    public List<ObraDTO> listar(
            @PageableDefault(size = 20) Pageable p,
            @RequestParam(name = "id_cliente", required = false) Long idCliente,
            @RequestHeader(value = "X-Empresa-Id", required = false) Long empresaId
    ) {
        return (idCliente != null ? svc.listarPorCliente(idCliente, p, empresaId) : svc.listar(p, empresaId)).getContent();
    }
    @GetMapping("/resumen")
    public Page<ObraListDTO> listarResumen(
            @PageableDefault(size = 50, sort = "id", direction = Sort.Direction.DESC) Pageable p,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) String q,
            @RequestHeader(value = "X-Empresa-Id", required = false) Long empresaId
    ) {
        EstadoObraEnum estadoEnum = null;
        if (estado != null && !estado.isBlank()) {
            try { estadoEnum = EstadoObraEnum.valueOf(estado.trim().toUpperCase()); } catch (Exception ignored) {}
        }
        return svc.listarResumen(p, estadoEnum, activo, q, empresaId);
    }
    @PutMapping("/{id}") public ObraDTO update(@PathVariable("id") Long id, @RequestBody ObraDTO dto){ return svc.actualizar(id,dto); }
    @PatchMapping("/{id}/estado/{estado}")
    public void changeEstado(@PathVariable("id") Long id, @PathVariable("estado") com.obras.enums.EstadoObraEnum estado) {
        svc.cambiarEstado(id, estado);
    }
    @PatchMapping("/{id}/activo") public void activar(@PathVariable("id") Long id){ svc.activar(id); }

}

