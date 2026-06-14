package com.clientes.repository;

import com.clientes.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
  @Query("SELECT c FROM Cliente c WHERE c.id_empresa = :idEmpresa")
  List<Cliente> findByIdEmpresa(@Param("idEmpresa") Long idEmpresa);

  @Query("SELECT c FROM Cliente c WHERE c.id_empresa = :idEmpresa")
  Page<Cliente> findByIdEmpresa(@Param("idEmpresa") Long idEmpresa, Pageable pageable);
}
