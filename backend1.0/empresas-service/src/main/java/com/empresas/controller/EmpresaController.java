package com.empresas.controller;

import com.empresas.dto.EmpresaRequest;
import com.empresas.dto.EmpresaResponse;
import com.empresas.service.EmpresaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the company catalog.
 */
@RestController
@RequestMapping("/api/v1/empresas")
@RequiredArgsConstructor
@Validated
@Tag(name = "Empresas", description = "Operaciones CRUD de empresas")
public class EmpresaController {

    private final EmpresaService empresaService;

    /**
     * Lists all companies.
     *
     * @param usuarioId optional filter by user
     * @return list of responses
     */
    @GetMapping
    @Operation(summary = "Listar empresas")
    public ResponseEntity<List<EmpresaResponse>> findAll(@RequestParam(name = "usuarioId", required = false) Long usuarioId) {
        if (usuarioId != null) {
            return ResponseEntity.ok(empresaService.findByUsuario(usuarioId));
        }
        return ResponseEntity.ok(empresaService.findAll());
    }

    /**
     * Retrieves a company detail.
     *
     * @param id identifier
     * @return response entity
     */
    @GetMapping("/{id}")
    @Operation(summary = "Obtener empresa por id")
    public ResponseEntity<EmpresaResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(empresaService.findById(id));
    }

    /**
     * Creates a new company entry.
     *
     * @param request payload
     * @return created resource
     */
    @PostMapping
    @Operation(summary = "Crear empresa")
    public ResponseEntity<EmpresaResponse> create(@Valid @RequestBody EmpresaRequest request) {
        EmpresaResponse response = empresaService.create(request);
        return ResponseEntity.created(URI.create("/api/v1/empresas/" + response.id())).body(response);
    }

    /**
     * Updates an existing company.
     *
     * @param id      identifier
     * @param request payload
     * @return updated resource
     */
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar empresa")
    public ResponseEntity<EmpresaResponse> update(@PathVariable Long id, @Valid @RequestBody EmpresaRequest request) {
        return ResponseEntity.ok(empresaService.update(id, request));
    }

    /**
     * Deletes a company by id.
     *
     * @param id identifier
     * @return empty response
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar empresa")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        empresaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
