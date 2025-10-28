package proveedores.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proveedores.dto.ProveedorDTO;
import proveedores.dto.TipoProveedorDTO;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.service.ProveedorService;

import java.util.List;
import java.util.stream.Collectors;

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
        dto.setActivo(entity.getActivo());
        dto.setCreado_en(entity.getCreadoEn());
        dto.setUltima_actualizacion(entity.getUltimaActualizacion());
        dto.setTipo_actualizacion(entity.getTipoActualizacion());

        if (entity.getTipoProveedor() != null) {
            TipoProveedorDTO tipoDto = new TipoProveedorDTO();
            tipoDto.setId(entity.getTipoProveedor().getId());
            tipoDto.setNombre(entity.getTipoProveedor().getNombre());
            tipoDto.setActivo(entity.getTipoProveedor().getActivo());
            tipoDto.setUltima_actualizacion(entity.getTipoProveedor().getUltimaActualizacion());
            tipoDto.setTipo_actualizacion(entity.getTipoProveedor().getTipoActualizacion());
            dto.setTipo_proveedor(tipoDto);
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
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);

        if (dto.getTipo_proveedor() != null) {
            TipoProveedor tipo = new TipoProveedor();
            tipo.setId(dto.getTipo_proveedor().getId());
            tipo.setNombre(dto.getTipo_proveedor().getNombre());
            tipo.setActivo(dto.getTipo_proveedor().getActivo() != null ? dto.getTipo_proveedor().getActivo() : Boolean.TRUE);
            entity.setTipoProveedor(tipo);
        }

        return entity;
    }

    private TipoProveedorDTO toDTO(TipoProveedor entity) {
        TipoProveedorDTO dto = new TipoProveedorDTO();
        dto.setId(entity.getId());
        dto.setNombre(entity.getNombre());
        dto.setActivo(entity.getActivo());
        dto.setUltima_actualizacion(entity.getUltimaActualizacion());
        dto.setTipo_actualizacion(entity.getTipoActualizacion());
        return dto;
    }

    private TipoProveedor toEntity(TipoProveedorDTO dto) {
        TipoProveedor entity = new TipoProveedor();
        entity.setId(dto.getId());
        entity.setNombre(dto.getNombre());
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);
        return entity;
    }

    // ======== ENDPOINTS ========

    @GetMapping
    public ResponseEntity<List<ProveedorDTO>> getAllActivos() {
        List<ProveedorDTO> result = service.findAllActivos()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
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
        Proveedor saved = service.save(toEntity(dto));
        return ResponseEntity.ok(toDTO(saved));
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

    @GetMapping("/tipo_proveedor")
    public ResponseEntity<List<TipoProveedorDTO>> getAllTypes() {
        List<TipoProveedorDTO> result = service.findAllTipoActivos()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/tipo_proveedor/{id}")
    public ResponseEntity<TipoProveedorDTO> getTipoById(@PathVariable("id") Long id) {
        return service.findTipoById(id)
                .map(tp -> ResponseEntity.ok(toDTO(tp)))
                .orElse(ResponseEntity.notFound().build());
    }
}
