package proveedores.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import proveedores.entity.Proveedor;
import proveedores.entity.TipoProveedor;
import proveedores.repository.ProveedorRepository;
import proveedores.repository.TipoProveedorRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository repository;
    private final TipoProveedorRepository tipoProveedorRepo;

    public List<TipoProveedor> findAllTipoActivos() {
        return tipoProveedorRepo.findByActivoTrue();
    }

    public Optional<TipoProveedor> findTipoById(Long id) {
        return tipoProveedorRepo.findByIdAndActivoTrue(id);
    }

    public List<Proveedor> findAllActivos() {
        return repository.findByActivoTrue();
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
                    existing.setTipoProveedor(proveedor.getTipoProveedor());
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
