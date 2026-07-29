package com.obras.controller;

import com.common.plan.PlanLimitChecker;
import com.obras.dto.*;
import com.obras.entity.ObraProveedor;
import com.obras.enums.EstadoObraEnum;
import com.obras.repository.ObraRepository;
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
    private final ObraRepository obraRepository;

    // OBRAS
    @PostMapping
    public ResponseEntity<ObraDTO> crear(
            @Valid @RequestBody ObraDTO dto,
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId,
            @RequestHeader(value = "X-Plan-Limites", required = false) String planLimites) {
        PlanLimitChecker.assertCanCreate(planLimites, "obras", "maxObrasActivas",
                () -> obraRepository.countByOrganizacionIdAndActivoTrue(organizacionId));
        dto.setOrganizacion_id(organizacionId);
        return ResponseEntity.ok(svc.crear(dto));
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
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId
    ) {
        return (idCliente != null
                ? svc.listarPorCliente(idCliente, organizacionId, p)
                : svc.listar(organizacionId, p)).getContent();
    }
    @GetMapping("/resumen")
    public Page<ObraListDTO> listarResumen(
            @PageableDefault(size = 50, sort = "id", direction = Sort.Direction.DESC) Pageable p,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) String q,
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId
    ) {
        EstadoObraEnum estadoEnum = null;
        if (estado != null && !estado.isBlank()) {
            try { estadoEnum = EstadoObraEnum.valueOf(estado.trim().toUpperCase()); } catch (Exception ignored) {}
        }
        return svc.listarResumen(p, estadoEnum, activo, q, organizacionId);
    }

    @PutMapping("/{id}") public ObraDTO update(@PathVariable("id") Long id, @RequestBody ObraDTO dto){ return svc.actualizar(id,dto); }
    @PatchMapping("/{id}/estado/{estado}")
    public void changeEstado(@PathVariable("id") Long id, @PathVariable("estado") com.obras.enums.EstadoObraEnum estado) {
        svc.cambiarEstado(id, estado);
    }
    @PatchMapping("/{id}/activo") public void activar(@PathVariable("id") Long id){ svc.activar(id); }

}

