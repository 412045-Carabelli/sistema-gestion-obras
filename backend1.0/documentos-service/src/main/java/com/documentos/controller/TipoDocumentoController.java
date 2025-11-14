package com.documentos.controller;

import com.documentos.dto.EstadoResponse;
import com.documentos.entity.TipoDocumento;
import com.documentos.enums.TipoDocumentoEnum;
import com.documentos.repository.TipoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documentos/tipo-documentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class TipoDocumentoController {

    @GetMapping
    public ResponseEntity<List<EstadoResponse>> getAll() {

        List<EstadoResponse> lista = Arrays.stream(TipoDocumentoEnum.values())
                .map(e -> new EstadoResponse(
                        e.name(),            // value
                        formatLabel(e.name()) // label
                ))
                .toList();

        return ResponseEntity.ok(lista);
    }

    // GET UNO POR VALUE STRING
    @GetMapping("/{tipo}")
    public ResponseEntity<EstadoResponse> getByTipo(@PathVariable String tipo) {
        try {
            TipoDocumentoEnum encontrado = TipoDocumentoEnum.valueOf(tipo.toUpperCase());

            EstadoResponse res = new EstadoResponse(
                    encontrado.name(),
                    formatLabel(encontrado.name())
            );

            return ResponseEntity.ok(res);

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    private String formatLabel(String raw) {
        return Arrays.stream(raw.split("_"))
                .map(w -> w.charAt(0) + w.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

}
