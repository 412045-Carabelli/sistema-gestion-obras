package com.clientes.controller;

import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.entity.CondicionIva;
import com.clientes.service.ClienteService;
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

    @PostMapping
    public ResponseEntity<ClienteResponse> save(
            @RequestBody @Valid ClienteRequest c,
            @RequestHeader(value = "X-Empresa-Id", required = false) Long empresaId) {
        return ResponseEntity.ok(service.crear(c, empresaId));
    }

    @GetMapping
    public List<ClienteResponse> all(
            @RequestHeader(value = "X-Empresa-Id", required = false) Long empresaId) {
        return service.listar(empresaId);
    }

    @GetMapping("/con-detalles")
    public Page<ClienteResponse> listarConDetalles(
            Pageable pageable,
            @RequestHeader(value = "X-Empresa-Id", required = false) Long empresaId) {
        return service.listarConDetalles(pageable, empresaId);
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

