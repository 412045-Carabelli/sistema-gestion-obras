package com.transacciones.controller;

import com.transacciones.dto.TipoTransaccionDto;
import com.transacciones.entity.TipoTransaccion;
import com.transacciones.service.TipoTransaccionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transacciones/tipo-transaccion")
@RequiredArgsConstructor
@CrossOrigin
public class TipoTransaccionController {

    private final TipoTransaccionService tipoTransaccionService;

    @GetMapping
    public ResponseEntity<List<TipoTransaccionDto>> getAll() {
        List<TipoTransaccionDto> lista = tipoTransaccionService.listar()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoTransaccionDto> getById(@PathVariable("id") Long id) {
        TipoTransaccion entity = tipoTransaccionService.obtener(id);
        return ResponseEntity.ok(toDto(entity));
    }

    @PostMapping
    public ResponseEntity<TipoTransaccionDto> create(@RequestBody TipoTransaccionDto dto) {
        TipoTransaccion saved = tipoTransaccionService.crear(toEntity(dto));
        return ResponseEntity.ok(toDto(saved));
    }


    // ==============================
    // 🧠 Métodos auxiliares
    // ==============================

    private TipoTransaccionDto toDto(TipoTransaccion entity) {
        return TipoTransaccionDto.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .activo(entity.getActivo())
                .ultima_actualizacion(entity.getUltimaActualizacion())
                .tipo_actualizacion(entity.getTipoActualizacion())
                .build();
    }

    private TipoTransaccion toEntity(TipoTransaccionDto dto) {
        return TipoTransaccion.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .activo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE)
                .build();
    }
}
