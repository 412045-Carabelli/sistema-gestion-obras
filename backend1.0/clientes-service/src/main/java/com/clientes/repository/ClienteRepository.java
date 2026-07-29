package com.clientes.repository;

import com.clientes.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByOrganizacionId(Long organizacionId);
    org.springframework.data.domain.Page<Cliente> findByOrganizacionId(Long organizacionId, org.springframework.data.domain.Pageable pageable);
    long countByOrganizacionIdAndActivoTrue(Long organizacionId);
}
