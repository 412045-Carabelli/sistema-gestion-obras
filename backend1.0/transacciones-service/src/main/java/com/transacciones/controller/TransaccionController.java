package com.transacciones.controller;

import com.transacciones.dto.TipoTransaccionDto;
import com.transacciones.dto.TransaccionDto;
import com.transacciones.entity.TipoTransaccion;
import com.transacciones.entity.Transaccion;
import com.transacciones.service.TipoTransaccionService;
import com.transacciones.service.TransaccionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transacciones")
@RequiredArgsConstructor
@CrossOrigin
public class TransaccionController {

    private final TransaccionService transaccionService;
    private final TipoTransaccionService tipoTransaccionService;

    @GetMapping
    public ResponseEntity<List<TransaccionDto>> getAll() {
        List<TransaccionDto> lista = transaccionService.listar()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransaccionDto> getById(@PathVariable("id") Long id) {
        Transaccion entity = transaccionService.obtener(id);
        return ResponseEntity.ok(toDto(entity));
    }

    @GetMapping("/obra/{obraId}")
    public ResponseEntity<List<TransaccionDto>> getByObra(@PathVariable("obraId") Long obraId) {
        List<TransaccionDto> lista = transaccionService.listarPorObra(obraId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @PostMapping
    public ResponseEntity<TransaccionDto> create(@RequestBody TransaccionDto dto) {
        Transaccion saved = transaccionService.crear(toEntity(dto));
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransaccionDto> update(@PathVariable("id") Long id, @RequestBody TransaccionDto dto) {
        Transaccion updated = transaccionService.actualizar(id, toEntity(dto));
        return ResponseEntity.ok(toDto(updated));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        transaccionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ==============================
    // 🧠 Métodos auxiliares
    // ==============================

    private TransaccionDto toDto(Transaccion entity) {
        TipoTransaccionDto tipoDto = null;
        if (entity.getTipo_transaccion() != null) {
            tipoDto = TipoTransaccionDto.builder()
                    .id(entity.getTipo_transaccion().getId())
                    .nombre(entity.getTipo_transaccion().getNombre())
                    .build();
        }

        return TransaccionDto.builder()
                .id(entity.getId())
                .id_obra(entity.getIdObra())
                .tipo_transaccion(tipoDto)
                .fecha(entity.getFecha())
                .monto(entity.getMonto())
                .forma_pago(entity.getForma_pago())
                .build();
    }

    private Transaccion toEntity(TransaccionDto dto) {
        Transaccion entity = new Transaccion();
        entity.setId(dto.getId());
        entity.setIdObra(dto.getId_obra());
        entity.setFecha(dto.getFecha());
        entity.setMonto(dto.getMonto());
        entity.setForma_pago(dto.getForma_pago());

        if (dto.getTipo_transaccion() != null) {
            // Buscamos la entidad real para asociarla
            TipoTransaccion tipo = tipoTransaccionService.obtener(
                    dto.getTipo_transaccion().getId()
            );
            entity.setTipo_transaccion(tipo);
        }

        return entity;
    }
}
