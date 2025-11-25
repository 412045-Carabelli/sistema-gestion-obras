package proveedores.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import proveedores.dto.MovimientoDTO;
import proveedores.entity.Gremio;
import proveedores.entity.Movimiento;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.exception.ClaveInvalidaException;
import proveedores.integration.ObrasClient;
import proveedores.repository.GremioRepository;
import proveedores.repository.MovimientoRepository;
import proveedores.repository.ProveedorRepository;
import proveedores.repository.TipoProveedorRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProveedorService {

    private final ProveedorRepository repository;
    private final TipoProveedorRepository tipoProveedorRepo;
    private final GremioRepository gremioRepository;
    private final MovimientoRepository movimientoRepository;
    private final ObrasClient obrasClient;

    @Value("${proveedores.movimientos.clave:CLAVE123}")
    private String claveMovimientos;

    public List<TipoProveedor> findAllTipoActivos() {
        return tipoProveedorRepo.findByActivoTrue();
    }

    public List<Gremio> findAllGremiosActivos() {
        return gremioRepository.findByActivoTrue();
    }

    public Optional<TipoProveedor> findTipoById(Long id) {
        return tipoProveedorRepo.findByIdAndActivoTrue(id);
    }

    public List<Proveedor> findAllActivos() {
        return repository.findByActivoTrue();
    }

    public Optional<Proveedor> findById(Long id) {
        return repository.findById(id);
    }

    public Proveedor save(Proveedor proveedor) {
        validateProveedor(proveedor);
        proveedor.setActivo(proveedor.getActivo() != null ? proveedor.getActivo() : Boolean.TRUE);
        return repository.save(proveedor);
    }

    public Proveedor update(Long id, Proveedor proveedor) {
        validateProveedor(proveedor);
        return repository.findById(id)
                .map(existing -> {
                    existing.setNombre(proveedor.getNombre());
                    existing.setDniCuit(proveedor.getDniCuit());
                    existing.setContacto(proveedor.getContacto());
                    existing.setTelefono(proveedor.getTelefono());
                    existing.setEmail(proveedor.getEmail());
                    existing.setDireccion(proveedor.getDireccion());
                    existing.setTipo(proveedor.getTipo());
                    existing.setGremio(proveedor.getGremio());
                    existing.setActivo(proveedor.getActivo() != null ? proveedor.getActivo() : existing.getActivo());
                    return repository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
    }

    public void delete(Long id) {
        repository.findById(id)
                .ifPresent(proveedor -> {
                    proveedor.setActivo(false);
                    repository.save(proveedor);
                });
    }

    public void activar(Long id) {
        repository.findById(id).ifPresent(p -> {
            p.setActivo(true);
            repository.save(p);
        });
    }

    public void desactivar(Long id) {
        repository.findById(id).ifPresent(p -> {
            p.setActivo(false);
            repository.save(p);
        });
    }

    public TipoProveedor agregarTipo(String nombre) {
        if (!StringUtils.hasText(nombre)) {
            throw new IllegalArgumentException("El nombre del tipo es obligatorio");
        }
        return tipoProveedorRepo.findByNombreIgnoreCase(nombre)
                .orElseGet(() -> {
                    TipoProveedor tipo = new TipoProveedor();
                    tipo.setNombre(nombre.trim());
                    tipo.setActivo(true);
                    return tipoProveedorRepo.save(tipo);
                });
    }

    public Gremio agregarGremio(String nombre) {
        if (!StringUtils.hasText(nombre)) {
            throw new IllegalArgumentException("El nombre del gremio es obligatorio");
        }
        return gremioRepository.findByNombreIgnoreCase(nombre)
                .orElseGet(() -> {
                    Gremio gremio = new Gremio();
                    gremio.setNombre(nombre.trim());
                    gremio.setActivo(true);
                    return gremioRepository.save(gremio);
                });
    }

    public Movimiento crearMovimiento(Long proveedorId, Movimiento movimiento) {
        Proveedor proveedor = repository.findById(proveedorId)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        movimiento.setProveedor(proveedor);
        normalizarMovimiento(movimiento);
        return movimientoRepository.save(movimiento);
    }

    public Movimiento actualizarMovimiento(Long movimientoId, Movimiento movimiento) {
        normalizarMovimiento(movimiento);
        return movimientoRepository.findById(movimientoId)
                .map(existing -> {
                    existing.setObraId(movimiento.getObraId());
                    existing.setDescripcion(movimiento.getDescripcion());
                    existing.setMonto(movimiento.getMonto());
                    existing.setMontoPagado(movimiento.getMontoPagado());
                    existing.setPagado(movimiento.getPagado());
                    return movimientoRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));
    }

    public List<MovimientoDTO> listarMovimientos(Long proveedorId) {
        return movimientoRepository.findByProveedorId(proveedorId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MovimientoDTO> listarPendientes() {
        return movimientoRepository.findByPagadoFalse().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void eliminarMovimiento(Long id, String clave) {
        if (!StringUtils.hasText(clave) || !clave.equals(claveMovimientos)) {
            throw new ClaveInvalidaException("Clave incorrecta");
        }
        movimientoRepository.deleteById(id);
    }

    public void eliminarMovimientosPorObra(Long obraId) {
        movimientoRepository.deleteByObraId(obraId);
    }

    public List<Proveedor> findAll() {
        return repository.findAll();
    }

    private void validateProveedor(Proveedor proveedor) {
        if (!StringUtils.hasText(proveedor.getDniCuit())) {
            throw new IllegalArgumentException("El DNI/CUIT es obligatorio");
        }
        if (!StringUtils.hasText(proveedor.getNombre())) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
    }

    private void normalizarMovimiento(Movimiento movimiento) {
        if (movimiento.getMonto() == null) {
            movimiento.setMonto(BigDecimal.ZERO);
        }
        if (movimiento.getMontoPagado() == null) {
            movimiento.setMontoPagado(BigDecimal.ZERO);
        }
        if (movimiento.getPagado() == null) {
            movimiento.setPagado(Boolean.FALSE);
        }
        if (movimiento.getMontoPagado().compareTo(movimiento.getMonto()) >= 0) {
            movimiento.setPagado(true);
        }
    }

    private MovimientoDTO toDTO(Movimiento movimiento) {
        String obraNombre = null;
        if (movimiento.getObraId() != null) {
            try {
                obraNombre = obrasClient.obtenerNombreObra(movimiento.getObraId()).orElse(null);
            } catch (Exception ex) {
                log.warn("No se pudo obtener la obra {}: {}", movimiento.getObraId(), ex.getMessage());
            }
        }
        BigDecimal saldoPendiente = calcularSaldoPendiente(movimiento);
        return MovimientoDTO.builder()
                .id(movimiento.getId())
                .proveedorId(movimiento.getProveedor() != null ? movimiento.getProveedor().getId() : null)
                .obraId(movimiento.getObraId())
                .obraNombre(obraNombre)
                .descripcion(movimiento.getDescripcion())
                .monto(movimiento.getMonto())
                .montoPagado(movimiento.getMontoPagado())
                .saldoPendiente(saldoPendiente)
                .estadoPago(Boolean.TRUE.equals(movimiento.getPagado()) ? "Pagado" : "Pendiente")
                .creadoEn(movimiento.getCreadoEn())
                .build();
    }

    private BigDecimal calcularSaldoPendiente(Movimiento movimiento) {
        if (Boolean.TRUE.equals(movimiento.getPagado())) {
            return BigDecimal.ZERO;
        }
        BigDecimal saldo = movimiento.getMonto().subtract(movimiento.getMontoPagado());
        return saldo.max(BigDecimal.ZERO);
    }
}
