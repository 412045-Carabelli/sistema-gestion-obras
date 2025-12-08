package proveedores.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import proveedores.entity.Gremio;
import proveedores.repository.GremioRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GremioService {

    private final GremioRepository repo;

    public List<Gremio> findAllActivos() {
        return repo.findByActivoTrue();
    }

    public Optional<Gremio> findById(Long id) {
        return repo.findByIdAndActivoTrue(id);
    }

    public Gremio save(Gremio g) {
        if (g.getActivo() == null) g.setActivo(true);
        return repo.save(g);
    }

    public Optional<Gremio> update(Long id, Gremio g) {
        return repo.findById(id).map(existing -> {
            existing.setNombre(g.getNombre());
            existing.setActivo(g.getActivo() != null ? g.getActivo() : existing.getActivo());
            return repo.save(existing);
        });
    }

    public boolean delete(Long id) {
        return repo.findById(id).map(g -> {
            g.setActivo(false);
            repo.save(g);
            return true;
        }).orElse(false);
    }
}
