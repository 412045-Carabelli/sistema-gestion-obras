package com.documentos.controller;

import com.documentos.entity.TipoDocumento;
import com.documentos.repository.TipoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documentos/tipo-documentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class TipoDocumentoController {

    private final TipoDocumentoRepository tipoDocumentoRepository;

    // ✅ GET - Listar todos
    @GetMapping
    public ResponseEntity<List<TipoDocumento>> getAll() {
        return ResponseEntity.ok(tipoDocumentoRepository.findAll());
    }

    // ✅ GET - Obtener uno
    @GetMapping("/{id}")
    public ResponseEntity<TipoDocumento> getById(@PathVariable("id") Long id) {
        return tipoDocumentoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}
