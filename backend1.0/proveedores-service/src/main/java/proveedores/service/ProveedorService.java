package proveedores.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import proveedores.entity.Proveedor;
import proveedores.entity.Gremio;
import proveedores.entity.TipoProveedor;
import proveedores.repository.GremioRepository;
import proveedores.repository.ProveedorRepository;
import proveedores.repository.TipoProveedorRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository repository;
    private final TipoProveedorRepository tipoProveedorRepo;
    private final GremioRepository gremioRepo;

    public List<TipoProveedor> findAllTipoActivos() {
        return tipoProveedorRepo.findByActivoTrue();
    }

    public Optional<TipoProveedor> findTipoById(Long id) {
        return tipoProveedorRepo.findByIdAndActivoTrue(id);
    }

    public Optional<TipoProveedor> findTipoByNombre(String nombre) {
        return tipoProveedorRepo.findByNombreIgnoreCase(nombre);
    }

    public TipoProveedor saveTipo(TipoProveedor tipo) {
        tipo.setActivo(true);
        return tipoProveedorRepo.save(tipo);
    }

    public Optional<TipoProveedor> updateTipo(Long id, TipoProveedor tipo) {
        return tipoProveedorRepo.findByIdAndActivoTrue(id)
                .map(existing -> {
                    existing.setNombre(tipo.getNombre());
                    existing.setActivo(tipo.getActivo() != null ? tipo.getActivo() : existing.getActivo());
                    return tipoProveedorRepo.save(existing);
                });
    }

    public boolean deleteTipo(Long id) {
        return tipoProveedorRepo.findByIdAndActivoTrue(id)
                .map(tipoProveedor -> {
                    tipoProveedor.setActivo(false);
                    tipoProveedorRepo.save(tipoProveedor);
                    return true;
                })
                .orElse(false);
    }

    public List<Proveedor> findAllActivos() {
        return repository.findByActivoTrue();
    }

    public Optional<Gremio> findGremioById(Long id) {
        return gremioRepo.findByIdAndActivoTrue(id);
    }

    public Optional<Proveedor> findById(Long id) {
        return repository.findByIdAndActivoTrue(id);
    }

    public Proveedor save(Proveedor proveedor) {
        proveedor.setActivo(true);
        return repository.save(proveedor);
    }

    public Proveedor update(Long id, Proveedor proveedor) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setNombre(proveedor.getNombre());
                    existing.setContacto(proveedor.getContacto());
                    existing.setTelefono(proveedor.getTelefono());
                    existing.setEmail(proveedor.getEmail());
                    existing.setTipoProveedor(proveedor.getTipoProveedor() != null ? proveedor.getTipoProveedor() : existing.getTipoProveedor());
                    existing.setGremio(proveedor.getGremio() != null ? proveedor.getGremio() : existing.getGremio());
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

    public List<Proveedor> findAll() {
        return repository.findAll();
    }
}
