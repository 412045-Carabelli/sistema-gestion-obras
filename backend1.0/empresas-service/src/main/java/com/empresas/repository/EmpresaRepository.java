package com.empresas.repository;

import com.empresas.entity.Empresa;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository abstraction for {@link Empresa} persistence operations.
 */
public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    /**
     * Retrieves all companies that belong to a specific user.
     *
     * @param usuarioId identifier of the owner user
     * @return list of companies
     */
    List<Empresa> findByUsuarioId(Long usuarioId);
}
