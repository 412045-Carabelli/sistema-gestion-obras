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
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoService documentoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<DocumentoDto>> create(
            @RequestPart(value = "id_obra", required = false) String idObra,
            @RequestPart("id_tipo_documento") String idTipoDocumento,
            @RequestPart(value = "id_asociado", required = false) String idAsociado,
            @RequestPart(value = "tipo_asociado", required = false) String tipoAsociado,
            @RequestPart(value = "observacion", required = false) String observacion,
            @RequestPart("file") FilePart filePart
    ) {
        return documentoService.createWithFileReactive(idObra, idTipoDocumento, observacion, idAsociado, tipoAsociado, filePart)
                .map(dto -> ResponseEntity.status(HttpStatus.CREATED).body(dto));
    }

    // 🔍 Nuevo endpoint: obtener documentos por tipo e ID asociado (cliente/proveedor)
    @GetMapping("/asociado/{tipo}/{id}")
    public Flux<DocumentoDto> getDocumentosPorAsociado(
            @PathVariable("tipo") String tipo,
            @PathVariable("id") Long id
    ) {
        return documentoService.findByTipoAsociado(tipo.toUpperCase(), id);
    }

    @GetMapping("/obra/{obraId}")
    public Flux<DocumentoDto> getDocumentosPorObra(@PathVariable("obraId") Long obraId) {
        return documentoService.findByObra(obraId);
    }

    @GetMapping
    public Flux<DocumentoDto> getAllDocumentos() {
        return documentoService.findAll();
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<DocumentoDto>> getDocumentoById(@PathVariable("id") Long id) {
        return documentoService.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteDocumento(@PathVariable("id") Long id) {
        return documentoService.delete(id);
    }

    @GetMapping("/{id}/download")
    public Mono<ResponseEntity<Resource>> download(@PathVariable("id") Long id) {
        return documentoService.downloadFile(id);
    }
}
