package com.auth.controller;

import com.auth.dto.DescuentoRequest;
import com.auth.dto.DescuentoResponse;
import com.auth.service.DescuentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DescuentoController {

    private final DescuentoService descuentoService;

    // --- Admin: CRUD completo ---

    @GetMapping("/auth/admin/descuentos")
    public ResponseEntity<List<DescuentoResponse>> listar() {
        return ResponseEntity.ok(descuentoService.listar());
    }

    @GetMapping("/auth/admin/descuentos/{id}")
    public ResponseEntity<DescuentoResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(descuentoService.obtenerPorId(id));
    }

    @PostMapping("/auth/admin/descuentos")
    public ResponseEntity<DescuentoResponse> crear(
            @Valid @RequestBody DescuentoRequest request,
            @RequestHeader(value = "X-User-Name", defaultValue = "admin") String creadoPor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(descuentoService.crear(request, creadoPor));
    }

    @PutMapping("/auth/admin/descuentos/{id}")
    public ResponseEntity<DescuentoResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody DescuentoRequest request) {
        return ResponseEntity.ok(descuentoService.actualizar(id, request));
    }

    @DeleteMapping("/auth/admin/descuentos/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        descuentoService.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    // --- Público: listar cupones vigentes ---

    @GetMapping("/auth/descuentos/vigentes")
    public ResponseEntity<List<DescuentoResponse>> listarVigentes() {
        return ResponseEntity.ok(descuentoService.listarVigentes());
    }

    // --- Autenticado: validar cupón antes de suscribir ---

    @GetMapping("/auth/descuentos/validar/{codigo}")
    public ResponseEntity<Map<String, Object>> validarCupon(
            @PathVariable String codigo,
            @RequestParam BigDecimal precioBase,
            @RequestParam Long planId,
            @RequestParam String ciclo) {

        DescuentoResponse descuento = descuentoService.obtenerPorCodigo(codigo);
        BigDecimal montoDescuento = descuentoService.calcularDescuento(codigo, precioBase, planId, ciclo);
        BigDecimal precioFinal = precioBase.subtract(montoDescuento);

        return ResponseEntity.ok(Map.of(
                "valido", true,
                "codigo", descuento.getCodigo(),
                "descripcion", descuento.getDescripcion() != null ? descuento.getDescripcion() : "",
                "tipo", descuento.getTipo(),
                "valor", descuento.getValor(),
                "montoDescuento", montoDescuento,
                "precioBase", precioBase,
                "precioFinal", precioFinal
        ));
    }
}
