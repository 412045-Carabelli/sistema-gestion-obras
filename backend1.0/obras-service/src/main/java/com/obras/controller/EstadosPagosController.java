package com.obras.controller;

import com.obras.dto.EstadoResponse;
import com.obras.enums.EstadoObraEnum;
import com.obras.enums.EstadoPagoEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/obras")
@RequiredArgsConstructor
public class EstadosPagosController {

    @GetMapping("/estado-pago")
    public ResponseEntity<List<EstadoResponse>> getEstados() {
        List<EstadoResponse> response = Arrays.stream(EstadoPagoEnum.values())
                .map(e -> new EstadoResponse(e.name(), formatLabel(e)))
                .toList();

        return ResponseEntity.ok(response);
    }

    private String formatLabel(EstadoPagoEnum e) {
        return Arrays.stream(e.name().split("_"))
                .map(word -> word.charAt(0) + word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

}

