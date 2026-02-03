package proveedores.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proveedores.dto.ProveedorDTO;
import proveedores.entity.Gremio;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.service.GremioService;
import proveedores.service.ProveedorFinanzasService;
import proveedores.service.ProveedorService;

import java.util.List;

@RestController
@RequestMapping("/bff")
@RequiredArgsConstructor
public class ProveedoresBffController {

    private final ProveedorService proveedorService;
    private final GremioService gremioService;
    private final ProveedorFinanzasService finanzasService;

    // --- Proveedores ---
    @GetMapping("/proveedores")
    public ResponseEntity<List<ProveedorDTO>> getProveedores() {
        List<ProveedorDTO> dtos = proveedorService.findAllActivos().stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/proveedores/{id}")
    public ResponseEntity<ProveedorDTO> getProveedor(@PathVariable("id") Long id) {
        return proveedorService.findById(id)
                .map(p -> {
                    ProveedorDTO dto = toDTO(p);
                    try {
                        ProveedorFinanzasService.TotalesProveedor totales = finanzasService.calcularTotales(id);
                        dto.setTotalProveedor(totales.totalProveedor());
                        dto.setPagosRealizados(totales.pagosRealizados());
                        dto.setSaldoProveedor(totales.saldoProveedor());
                    } catch (Exception ignored) {
                    }
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/proveedores")
    public ResponseEntity<ProveedorDTO> createProveedor(@RequestBody ProveedorDTO dto) {
        try {
            Proveedor saved = proveedorService.save(toEntity(dto));
            return ResponseEntity.ok(toDTO(saved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/proveedores/{id}")
    public ResponseEntity<ProveedorDTO> updateProveedor(@PathVariable("id") Long id, @RequestBody ProveedorDTO dto) {
        try {
            Proveedor updated = proveedorService.update(id, toEntity(dto));
            return ResponseEntity.ok(toDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/proveedores/{id}")
    public ResponseEntity<Void> deleteProveedor(@PathVariable("id") Long id) {
        proveedorService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // --- Tipos de proveedor ---
    @GetMapping("/tipo-proveedor")
    public ResponseEntity<List<TipoProveedor>> getTipos() {
        return ResponseEntity.ok(proveedorService.findAllTipoActivos());
    }

    @PostMapping("/tipo-proveedor")
    public ResponseEntity<TipoProveedor> createTipo(@RequestBody TipoProveedor tipo) {
        tipo.setId(null);
        return ResponseEntity.ok(proveedorService.saveTipo(tipo));
    }

    // --- Gremios ---
    @GetMapping("/gremios")
    public ResponseEntity<List<Gremio>> getGremios() {
        return ResponseEntity.ok(gremioService.findAllActivos());
    }

    @PostMapping("/gremios")
    public ResponseEntity<Gremio> createGremio(@RequestBody Gremio gremio) {
        gremio.setId(null);
        return ResponseEntity.ok(gremioService.save(gremio));
    }

    // --- helpers ---
    private ProveedorDTO toDTO(Proveedor entity) {
        ProveedorDTO dto = new ProveedorDTO();
        dto.setId(entity.getId());
        dto.setNombre(entity.getNombre());
        dto.setCuit(entity.getDniCuit());
        dto.setDireccion(entity.getDireccion());
        dto.setContacto(entity.getContacto());
        dto.setTelefono(entity.getTelefono());
        dto.setEmail(entity.getEmail());
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
        entity.setDniCuit(dto.getCuit());
        entity.setDireccion(dto.getDireccion());
        entity.setContacto(dto.getContacto());
        entity.setTelefono(dto.getTelefono());
        entity.setEmail(dto.getEmail());
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE);

        if (dto.getTipo_proveedor_id() != null) {
            TipoProveedor tipo = proveedorService.findTipoById(dto.getTipo_proveedor_id())
                    .orElseThrow(() -> new RuntimeException("Tipo de proveedor no encontrado"));
            entity.setTipoProveedor(tipo);
        } else if (dto.getTipo_proveedor() != null) {
            TipoProveedor tipo = proveedorService.findTipoByNombre(dto.getTipo_proveedor())
                    .orElseThrow(() -> new RuntimeException("Tipo de proveedor no encontrado"));
            entity.setTipoProveedor(tipo);
        }

        if (dto.getGremio_id() != null) {
            Gremio gremio = gremioService.findById(dto.getGremio_id())
                    .orElseThrow(() -> new RuntimeException("Gremio no encontrado"));
            entity.setGremio(gremio);
        } else if (dto.getGremio_nombre() != null) {
            Gremio gremio = gremioService.findByNombre(dto.getGremio_nombre())
                    .orElseThrow(() -> new RuntimeException("Gremio no encontrado"));
            entity.setGremio(gremio);
        }

        return entity;
    }
}
