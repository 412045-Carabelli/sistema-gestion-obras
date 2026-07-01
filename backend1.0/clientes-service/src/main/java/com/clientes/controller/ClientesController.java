package com.clientes.controller;

import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.entity.CondicionIva;
import com.clientes.repository.ClienteRepository;
import com.clientes.service.ClienteService;
import com.common.plan.PlanLimitChecker;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClientesController {
    private final ClienteService service;
    private final ClienteRepository clienteRepository;

    @PostMapping
    public ResponseEntity<ClienteResponse> save(
            @RequestBody @Valid ClienteRequest c,
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId,
            @RequestHeader(value = "X-Plan-Limites", required = false) String planLimites) {
        PlanLimitChecker.assertCanCreate(
            planLimites, "clientes", "maxClientes",
            () -> clienteRepository.countByOrganizacionIdAndActivoTrue(organizacionId)
        );
        c.setOrganizacionId(organizacionId);
        return ResponseEntity.ok(service.crear(c));
    }

    @GetMapping
    public List<ClienteResponse> all(
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
        return service.listar(organizacionId);
    }

    @GetMapping("/con-detalles")
    public Page<ClienteResponse> listarConDetalles(
            Pageable pageable,
            @RequestHeader(value = "X-Organizacion-Id", defaultValue = "0") Long organizacionId) {
        return service.listarConDetalles(pageable, organizacionId);
    }

    @GetMapping("/{id}") public ResponseEntity<ClienteResponse> one(@PathVariable("id") Long id){ return ResponseEntity.ok(service.obtenerConObras(id)); }
    @PutMapping("/{id}") public ResponseEntity<ClienteResponse> upd(@PathVariable("id") Long id,@RequestBody @Valid ClienteRequest c){ return ResponseEntity.ok(service.actualizar(id, c)); }
    @DeleteMapping("/{id}") public void del(@PathVariable("id") Long id){ service.eliminar(id); }

    @GetMapping("/condicion-iva")
    public List<Map<String, String>> condicionesIva() {
        return Arrays.stream(CondicionIva.values())
                .map(v -> Map.of("name", v.name(), "label", prettyLabel(v)))
                .toList();
    }

    private String prettyLabel(CondicionIva v) {
        return switch (v) {
            case RESPONSABLE_INSCRIPTO -> "Responsable Inscripto";
            case MONOTRIBUTO -> "Monotributo";
            case EXENTO -> "Exento";
            case CONSUMIDOR_FINAL -> "Consumidor Final";
        };
    }
}

