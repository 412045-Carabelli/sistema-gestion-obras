package com.obras.controller;

import com.obras.dto.*;
import com.obras.entity.ObraProveedor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
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
    public ResponseEntity<ObraDTO> crear(@Valid @RequestBody ObraDTO dto){ return ResponseEntity.ok(svc.crear(dto)); }
    @GetMapping("/{id}") public ResponseEntity<ObraDTO> get(@PathVariable("id") Long id){ return svc.obtener(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @GetMapping
    public List<ObraDTO> listar(@PageableDefault(size = 20) Pageable p) {
        return svc.listar(p).getContent();
    }
    @PutMapping("/{id}") public ObraDTO update(@PathVariable("id") Long id, @RequestBody ObraDTO dto){ return svc.actualizar(id,dto); }
    @PatchMapping("/{id}/estado/{estado}")
    public void changeEstado(@PathVariable("id") Long id, @PathVariable("estado") com.obras.enums.EstadoObraEnum estado) {
        svc.cambiarEstado(id, estado);
    }
    @PatchMapping("/{id}/activo") public void activar(@PathVariable("id") Long id){ svc.activar(id); }

}

