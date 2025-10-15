package com.obras.controller;

import com.obras.dto.EstadoPagoDTO;
import com.obras.entity.EstadoPago;
import com.obras.repository.EstadoPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/obras/estado_pago")
@RequiredArgsConstructor
public class EstadosPagosController {

    private final EstadoPagoRepository repository;

    private EstadoPagoDTO toDTO(EstadoPago entity) {
        EstadoPagoDTO dto = new EstadoPagoDTO();
        dto.setId(entity.getId());
        dto.setEstado(entity.getEstado());
        return dto;
    }

    @GetMapping
    public ResponseEntity<List<EstadoPagoDTO>> getAll() {
        List<EstadoPagoDTO> estados = repository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(estados);
    }
}
