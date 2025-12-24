package com.transacciones.controller;

import com.transacciones.dto.FacturaDto;
import com.transacciones.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
@CrossOrigin
public class FacturaController {

    private final FacturaService facturaService;

    @GetMapping
    public ResponseEntity<List<FacturaDto>> getAll() {
        return ResponseEntity.ok(facturaService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacturaDto> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(facturaService.obtener(id));
    }

    @GetMapping("/cliente/{idCliente}")
    public ResponseEntity<List<FacturaDto>> getByCliente(@PathVariable("idCliente") Long idCliente) {
        return ResponseEntity.ok(facturaService.listarPorCliente(idCliente));
    }

    @GetMapping("/obra/{idObra}")
    public ResponseEntity<List<FacturaDto>> getByObra(@PathVariable("idObra") Long idObra) {
        return ResponseEntity.ok(facturaService.listarPorObra(idObra));
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<FacturaDto> create(
            @RequestParam("id_cliente") Long idCliente,
            @RequestParam("id_obra") Long idObra,
            @RequestParam("monto") Double monto,
            @RequestParam(value = "monto_restante", required = false) Double montoRestante,
            @RequestParam("fecha") String fecha,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        FacturaDto dto = FacturaDto.builder()
                .id_cliente(idCliente)
                .id_obra(idObra)
                .monto(monto)
                .monto_restante(montoRestante)
                .fecha(parseFecha(fecha))
                .build();

        return ResponseEntity.ok(facturaService.crear(dto, file));
    }

    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<FacturaDto> update(
            @PathVariable("id") Long id,
            @RequestParam("id_cliente") Long idCliente,
            @RequestParam("id_obra") Long idObra,
            @RequestParam("monto") Double monto,
            @RequestParam(value = "monto_restante", required = false) Double montoRestante,
            @RequestParam("fecha") String fecha,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        FacturaDto dto = FacturaDto.builder()
                .id(id)
                .id_cliente(idCliente)
                .id_obra(idObra)
                .monto(monto)
                .monto_restante(montoRestante)
                .fecha(parseFecha(fecha))
                .build();

        return ResponseEntity.ok(facturaService.actualizar(id, dto, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        facturaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{id}/download", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<Resource> download(@PathVariable("id") Long id) {
        return facturaService.descargarArchivo(id);
    }

    private LocalDate parseFecha(String fecha) {
        if (fecha == null || fecha.isEmpty()) {
            return LocalDate.now();
        }
        return LocalDate.parse(fecha);
    }
}
