package com.auth.controller;

import com.auth.dto.MiPlanResponse;
import com.auth.dto.PlanRequest;
import com.auth.dto.PlanResponse;
import com.auth.service.PlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    // --- Público: listado de planes (para página de pricing) ---

    @GetMapping("/auth/planes")
    public ResponseEntity<List<PlanResponse>> listar() {
        return ResponseEntity.ok(planService.listar());
    }

    @GetMapping("/auth/planes/{id}")
    public ResponseEntity<PlanResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(planService.obtenerPorId(id));
    }

    // --- Autenticado: plan de mi organización ---

    @GetMapping("/auth/mi-plan")
    public ResponseEntity<MiPlanResponse> miPlan(
            @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) {
        if (organizacionId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(planService.obtenerMiPlan(organizacionId));
    }

    // --- Admin: CRUD de planes ---

    @PostMapping("/auth/admin/planes")
    public ResponseEntity<PlanResponse> crear(@Valid @RequestBody PlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.crear(request));
    }

    @PutMapping("/auth/admin/planes/{id}")
    public ResponseEntity<PlanResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody PlanRequest request) {
        return ResponseEntity.ok(planService.actualizar(id, request));
    }

    @DeleteMapping("/auth/admin/planes/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        planService.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    // --- Suscripción propia ---

    @PatchMapping("/auth/mi-suscripcion/cancelar")
    public ResponseEntity<Void> cancelarSuscripcion(
            @RequestHeader(value = "X-Organizacion-Id", required = false) Long organizacionId) {
        if (organizacionId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        planService.cancelarSuscripcion(organizacionId);
        return ResponseEntity.noContent().build();
    }
}
