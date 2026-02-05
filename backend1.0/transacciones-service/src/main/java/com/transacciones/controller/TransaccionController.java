package com.transacciones.controller;

import com.transacciones.dto.ComisionPagoRequest;
import com.transacciones.dto.TransaccionDto;
import com.transacciones.entity.Transaccion;
import com.transacciones.enums.TipoTransaccionEnum;
import com.transacciones.service.TransaccionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transacciones")
@RequiredArgsConstructor
@CrossOrigin
public class TransaccionController {

    private final TransaccionService transaccionService;

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

    @PostMapping("/obra/{obraId}/comisiones/pago")
    public ResponseEntity<TransaccionDto> pagarComision(
            @PathVariable("obraId") Long obraId,
            @RequestBody(required = false) ComisionPagoRequest request
    ) {
        Double monto = request != null ? request.getMonto() : null;
        LocalDate fecha = request != null ? request.getFecha() : null;
        return ResponseEntity.ok(transaccionService.registrarPagoComision(obraId, monto, fecha));
    }

    @PatchMapping("/obra/{obraId}/inactivar")
    public ResponseEntity<Void> softDeleteByObra(@PathVariable("obraId") Long obraId) {
        transaccionService.desactivarPorObra(obraId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/obra/{obraId}/activar")
    public ResponseEntity<Void> activarPorObra(@PathVariable("obraId") Long obraId) {
        transaccionService.activarPorObra(obraId);
        return ResponseEntity.noContent().build();
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
        entity.setMedio_pago(dto.getMedio_pago());
        entity.setFacturaCobrada(dto.getFactura_cobrada());
        entity.setActivo(dto.getActivo());

        if (dto.getTipo_transaccion() != null) {
            entity.setTipo_transaccion(resolveTipo(dto.getTipo_transaccion()));
        }

        return entity;
    }

    private TipoTransaccionEnum resolveTipo(TipoTransaccionEnum dto) {
        return dto != null ? dto : TipoTransaccionEnum.PAGO;
    }
}
