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
        List<TransaccionDto> lista = transaccionService.listar();
        return ResponseEntity.ok(lista);
    }


    @GetMapping("/asociado/{tipo}/{id}")
    public ResponseEntity<List<TransaccionDto>> getDocumentosPorAsociado(
            @PathVariable("tipo") String tipo,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(transaccionService.findByTipoAsociado(tipo.toUpperCase(), id));
    }


    @GetMapping("/{id}")
    public ResponseEntity<TransaccionDto> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(transaccionService.obtener(id));
    }

    @GetMapping("/obra/{obraId}")
    public ResponseEntity<List<TransaccionDto>> getByObra(@PathVariable("obraId") Long obraId) {
        List<TransaccionDto> lista = transaccionService.listarPorObra(obraId);
        return ResponseEntity.ok(lista);
    }

    @PostMapping
    public ResponseEntity<TransaccionDto> create(@RequestBody TransaccionDto dto) {
        return ResponseEntity.ok(transaccionService.crear(toEntity(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransaccionDto> update(@PathVariable("id") Long id, @RequestBody TransaccionDto dto) {
        return ResponseEntity.ok(transaccionService.actualizar(id, toEntity(dto)));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        transaccionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }


    private Transaccion toEntity(TransaccionDto dto) {
        Transaccion entity = new Transaccion();
        entity.setId(dto.getId());
        entity.setIdObra(dto.getId_obra());
        entity.setIdAsociado(dto.getId_asociado());
        entity.setTipoAsociado(dto.getTipo_asociado());
        entity.setFecha(dto.getFecha());
        entity.setMonto(dto.getMonto());
        entity.setForma_pago(dto.getForma_pago());
        entity.setActivo(dto.getActivo());

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
