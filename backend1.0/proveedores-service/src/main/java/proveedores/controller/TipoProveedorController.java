package proveedores.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proveedores.entity.TipoProveedor;
import proveedores.service.ProveedorService;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores/tipo-proveedor")
@RequiredArgsConstructor
public class TipoProveedorController {

    private final ProveedorService service;

    @GetMapping
    public ResponseEntity<List<TipoProveedor>> getAll() {
        return ResponseEntity.ok(service.findAllTipoActivos());
    }

    @PostMapping
    public ResponseEntity<TipoProveedor> create(@RequestBody TipoProveedor tipo) {
        tipo.setId(null);
        return ResponseEntity.ok(service.saveTipo(tipo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TipoProveedor> update(@PathVariable("id") Long id, @RequestBody TipoProveedor tipo) {
        return service.updateTipo(id, tipo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        if (service.deleteTipo(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
