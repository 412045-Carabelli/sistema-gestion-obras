package com.obras.repository;

import com.obras.entity.GrupoObra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GrupoObrasRepository extends JpaRepository<GrupoObra, Long> {
  List<GrupoObra> findByIdClienteAndActivoTrue(Long idCliente);
  List<GrupoObra> findByIdCliente(Long idCliente);
  List<GrupoObra> findByActivoTrue();
}
