package com.transacciones.controller;

import com.transacciones.dto.EstadoResponse;
import com.transacciones.enums.TipoTransaccionEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transacciones/tipo-transaccion")
@RequiredArgsConstructor
@CrossOrigin
public class TipoTransaccionController {

    // sin servicio/repositorio: se exponen enums

    @GetMapping
    public ResponseEntity<List<EstadoResponse>> getAll() {
        List<EstadoResponse> lista = Arrays.stream(TipoTransaccionEnum.values())
                .map(e -> new EstadoResponse(e.name(), formatLabel(e)))
                .toList();

        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{tipo}")
    public ResponseEntity<EstadoResponse> getByTipo(@PathVariable("tipo") String tipo) {
        try {
            TipoTransaccionEnum encontrado = TipoTransaccionEnum.valueOf(tipo.toUpperCase());

            return ResponseEntity.ok(
                    new EstadoResponse(encontrado.name(), formatLabel(encontrado))
            );

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    private String formatLabel(Enum<?> e) {
        return Arrays.stream(e.name().split("_"))
                .map(word -> word.charAt(0) + word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }


}

