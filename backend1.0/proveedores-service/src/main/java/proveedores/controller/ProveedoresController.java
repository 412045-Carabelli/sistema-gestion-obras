package proveedores.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proveedores.dto.MovimientoDTO;
import proveedores.dto.MovimientoRequest;
import proveedores.dto.NombreRequest;
import proveedores.dto.ProveedorDTO;
import proveedores.entity.Gremio;
import proveedores.entity.Movimiento;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.exception.ClaveInvalidaException;
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

        return new ProveedorDTO(
                entity.getId(),
                entity.getNombre(),
                entity.getDniCuit(),
                entity.getTipo(),
                entity.getGremio(),
                entity.getContacto(),
                entity.getTelefono(),
                entity.getEmail(),
                entity.getDireccion(),
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
        entity.setDniCuit(dto.getDniCuit());
        entity.setContacto(dto.getContacto());
        entity.setTelefono(dto.getTelefono());
        entity.setEmail(dto.getEmail());
        entity.setDireccion(dto.getDireccion());
        entity.setTipo(dto.getTipo());
        entity.setGremio(dto.getGremio());
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
        return ResponseEntity.status(201).body(toDTO(saved));
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

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivar(@PathVariable("id") Long id) {
        service.desactivar(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<Void> activar(@PathVariable("id") Long id) {
        service.activar(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tipos")
    public ResponseEntity<TipoProveedor> crearTipo(@RequestBody NombreRequest request) {
        return ResponseEntity.status(201).body(service.agregarTipo(request.getNombre()));
    }

    @GetMapping("/tipos")
    public ResponseEntity<List<TipoProveedor>> listarTipos() {
        return ResponseEntity.ok(service.findAllTipoActivos());
    }

    @PostMapping("/gremios")
    public ResponseEntity<Gremio> crearGremio(@RequestBody NombreRequest request) {
        return ResponseEntity.status(201).body(service.agregarGremio(request.getNombre()));
    }

    @GetMapping("/gremios")
    public ResponseEntity<List<Gremio>> listarGremios() {
        return ResponseEntity.ok(service.findAllGremiosActivos());
    }

    @GetMapping("/{proveedorId}/movimientos")
    public ResponseEntity<List<MovimientoDTO>> listarMovimientos(@PathVariable Long proveedorId) {
        return ResponseEntity.ok(service.listarMovimientos(proveedorId));
    }

    @PostMapping("/{proveedorId}/movimientos")
    public ResponseEntity<MovimientoDTO> crearMovimiento(@PathVariable Long proveedorId, @RequestBody MovimientoRequest request) {
        Movimiento movimiento = toMovimiento(request);
        Movimiento guardado = service.crearMovimiento(proveedorId, movimiento);
        return ResponseEntity.status(201).body(service.listarMovimientos(proveedorId).stream()
                .filter(m -> m.getId().equals(guardado.getId()))
                .findFirst()
                .orElseThrow());
    }

    @PutMapping("/movimientos/{movimientoId}")
    public ResponseEntity<MovimientoDTO> actualizarMovimiento(@PathVariable Long movimientoId, @RequestBody MovimientoRequest request) {
        Movimiento movimiento = toMovimiento(request);
        Movimiento actualizado = service.actualizarMovimiento(movimientoId, movimiento);
        return ResponseEntity.ok(service.listarMovimientos(actualizado.getProveedor().getId()).stream()
                .filter(m -> m.getId().equals(actualizado.getId()))
                .findFirst()
                .orElseThrow());
    }

    @DeleteMapping("/movimientos/{movimientoId}")
    public ResponseEntity<Void> eliminarMovimiento(@PathVariable Long movimientoId, @RequestParam("clave") String clave) {
        service.eliminarMovimiento(movimientoId, clave);
        return ResponseEntity.ok().build();
    }

    @ExceptionHandler(ClaveInvalidaException.class)
    public ResponseEntity<Void> handleForbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    private Movimiento toMovimiento(MovimientoRequest request) {
        Movimiento movimiento = new Movimiento();
        movimiento.setObraId(request.getObraId());
        movimiento.setDescripcion(request.getDescripcion());
        movimiento.setMonto(request.getMonto());
        movimiento.setMontoPagado(request.getMontoPagado());
        movimiento.setPagado(request.getPagado());
        return movimiento;
    }
}
