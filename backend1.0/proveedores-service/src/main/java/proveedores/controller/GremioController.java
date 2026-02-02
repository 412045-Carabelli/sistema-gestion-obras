package proveedores.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proveedores.entity.Gremio;
import proveedores.service.GremioService;

import java.util.List;

@RestController
@RequestMapping("/api/gremios")
@RequiredArgsConstructor
public class GremioController {

    private final GremioService service;

    @GetMapping
    public ResponseEntity<List<Gremio>> getAll() {
        return ResponseEntity.ok(service.findAllActivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Gremio> getOne(@PathVariable("id") Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Gremio> create(@RequestBody Gremio gremio) {
        return ResponseEntity.ok(service.save(gremio));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Gremio> update(@PathVariable("id") Long id, @RequestBody Gremio gremio) {
        return service.update(id, gremio)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        return service.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
