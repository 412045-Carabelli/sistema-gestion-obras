package com.documentos.controller;

import com.documentos.dto.DocumentoDto;
import com.documentos.service.DocumentoService;
import org.springframework.core.io.Resource;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/documentos") // Ruta base para la API de documentos
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoService documentoService;

    /**
     * Endpoint para crear un nuevo documento subiendo un archivo.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<DocumentoDto>> create(
            @RequestPart("id_obra") String idObra,
            @RequestPart("id_tipo_documento") String idTipoDocumento,
            @RequestPart(value = "observacion", required = false) String observacion,
            @RequestPart("file") FilePart filePart
    ) {
        return documentoService.createWithFileReactive(idObra, idTipoDocumento, observacion, filePart)
                .map(dto -> ResponseEntity.status(HttpStatus.CREATED).body(dto));
    }

    /**
     * Endpoint para obtener todos los documentos de una obra.
     */
    @GetMapping("/obra/{obraId}")
    public Flux<DocumentoDto> getDocumentosPorObra(@PathVariable("obraId") Long obraId) {
        return documentoService.findByObra(obraId);
    }

    /**
     * Endpoint para obtener todos los documentos.
     */
    @GetMapping
    public Flux<DocumentoDto> getAllDocumentos() {
        return documentoService.findAll();
    }

    /**
     * Endpoint para obtener un documento por su ID.
     */
    @GetMapping("/{id}")
    public Mono<ResponseEntity<DocumentoDto>> getDocumentoById(@PathVariable("id") Long id) {
        return documentoService.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint para eliminar un documento por su ID.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT) // Devuelve 204 No Content si tiene éxito
    public Mono<Void> deleteDocumento(@PathVariable("id") Long id) {
        return documentoService.delete(id);
    }

    @GetMapping("/{id}/download")
    public Mono<ResponseEntity<Resource>> download(@PathVariable("id") Long id) {
        return documentoService.downloadFile(id);
    }

}