package proveedores.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proveedores.dto.ProveedorDTO;
import proveedores.entity.Gremio;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.service.ProveedorService;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
public class ProveedoresController {

    private final ProveedorService service;

    // ======== HELPERS ========

    private ProveedorDTO toDTO(Proveedor entity) {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setId(entity.getId());
        dto.setNombre(entity.getNombre());
        dto.setContacto(entity.getContacto());
        dto.setTelefono(entity.getTelefono());
        dto.setEmail(entity.getEmail());
        dto.setDireccion(entity.getDireccion());
        dto.setCuit(entity.getDniCuit());
        dto.setActivo(entity.getActivo());
        dto.setCreado_en(entity.getCreadoEn());
        dto.setUltima_actualizacion(entity.getUltimaActualizacion());
        dto.setTipo_actualizacion(entity.getTipoActualizacion());

        if (entity.getTipoProveedor() != null) {
            dto.setTipo_proveedor_id(entity.getTipoProveedor().getId());
            dto.setTipo_proveedor_nombre(entity.getTipoProveedor().getNombre());
            dto.setTipo_proveedor(entity.getTipoProveedor().getNombre());
        }

        if (entity.getGremio() != null) {
            dto.setGremio_id(entity.getGremio().getId());
            dto.setGremio_nombre(entity.getGremio().getNombre());
        }

        return dto;
    }

    private Proveedor toEntity(ProveedorDTO dto) {
        Proveedor entity = new Proveedor();

        entity.setId(dto.getId());
        entity.setNombre(dto.getNombre());
        entity.setContacto(dto.getContacto());
        entity.setTelefono(dto.getTelefono());
        entity.setEmail(dto.getEmail());
        entity.setDireccion(dto.getDireccion());
        entity.setDniCuit(dto.getCuit());
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);

        if (dto.getTipo_proveedor_id() != null) {
            TipoProveedor tipo = service.findTipoById(dto.getTipo_proveedor_id())
                    .orElseThrow(() -> new RuntimeException("Tipo de proveedor no encontrado"));
            entity.setTipoProveedor(tipo);
        } else if (dto.getTipo_proveedor() != null) {
            TipoProveedor tipo = service.findTipoByNombre(dto.getTipo_proveedor())
                    .orElseThrow(() -> new RuntimeException("Tipo de proveedor no encontrado"));
            entity.setTipoProveedor(tipo);
        }

        if (dto.getGremio_id() != null) {
            Gremio gremio = service.findGremioById(dto.getGremio_id())
                    .orElseThrow(() -> new RuntimeException("Gremio no encontrado"));
            entity.setGremio(gremio);
        } else if (dto.getGremio_nombre() != null) {
            Gremio gremio = service.findGremioByNombre(dto.getGremio_nombre())
                    .orElseThrow(() -> new RuntimeException("Gremio no encontrado"));
            entity.setGremio(gremio);
        }

        return entity;
    }

    // ======== ENDPOINTS ========

    @GetMapping
    public ResponseEntity<List<ProveedorDTO>> getAllActivos() {
        List<ProveedorDTO> result = service.findAllActivos()
                .stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProveedorDTO> getById(@PathVariable("id") Long id) {
        return service.findById(id)
                .map(p -> ResponseEntity.ok(toDTO(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Proveedor>> getAllSinFiltro() {
        return ResponseEntity.ok(service.findAll());
    }


    @PostMapping
    public ResponseEntity<ProveedorDTO> create(@RequestBody ProveedorDTO dto) {
        try {
            Proveedor saved = service.save(toEntity(dto));
            return ResponseEntity.ok(toDTO(saved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProveedorDTO> update(@PathVariable("id") Long id, @RequestBody ProveedorDTO dto) {
        try {
            Proveedor updated = service.update(id, toEntity(dto));
            return ResponseEntity.ok(toDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
