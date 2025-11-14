package proveedores.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proveedores.dto.EstadoResponse;
import proveedores.dto.ProveedorDTO;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.enums.TipoProveedorEnum;
import proveedores.service.ProveedorService;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
public class ProveedoresController {

    private final ProveedorService service;

    // ======== HELPERS ========

    private ProveedorDTO toDTO(Proveedor entity) {

        return new ProveedorDTO(
                entity.getId(),
                entity.getNombre(),
                entity.getTipoProveedor(), // ENUM DIRECTO
                entity.getContacto(),
                entity.getTelefono(),
                entity.getEmail(),
                entity.getActivo(),
                entity.getCreadoEn(),
                entity.getUltimaActualizacion(),
                entity.getTipoActualizacion()
        );
    }


    private Proveedor toEntity(ProveedorDTO dto) {
        Proveedor entity = new Proveedor();

        entity.setId(dto.getId());
        entity.setNombre(dto.getNombre());
        entity.setContacto(dto.getContacto());
        entity.setTelefono(dto.getTelefono());
        entity.setEmail(dto.getEmail());
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);

        // 🔥 AQUÍ LA VALIDACIÓN REAL
        if (dto.getTipo_proveedor() != null) {
            entity.setTipoProveedor(dto.getTipo_proveedor());
        }

        return entity;
    }

    // ya no se usa DTO para tipo_proveedor

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

    @GetMapping("/tipo-proveedor")
    public ResponseEntity<List<EstadoResponse>> getEstados() {
        List<EstadoResponse> response = Arrays.stream(TipoProveedorEnum.values())
                .map(e -> new EstadoResponse(e.name(), formatLabel(e)))
                .toList();

        return ResponseEntity.ok(response);
    }

    private String formatLabel(TipoProveedorEnum e) {
        return Arrays.stream(e.name().split("_"))
                .map(word -> word.charAt(0) + word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }


    @GetMapping("/tipo-proveedor/{tipo}")
    public ResponseEntity<TipoProveedorEnum> getTipoByNombre(@PathVariable("tipo") String tipo) {
        try {
            return ResponseEntity.ok(TipoProveedorEnum.valueOf(tipo.toUpperCase()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
