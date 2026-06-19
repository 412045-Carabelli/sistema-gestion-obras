package com.obras.repository;

import com.obras.entity.GrupoObra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GrupoObrasRepository extends JpaRepository<GrupoObra, Long> {
  List<GrupoObra> findByIdClienteAndActivoTrue(Long idCliente);
  List<GrupoObra> findByIdClienteAndActivoTrueAndOrganizacionId(Long idCliente, Long organizacionId);
  List<GrupoObra> findByIdCliente(Long idCliente);
  List<GrupoObra> findByIdClienteAndOrganizacionId(Long idCliente, Long organizacionId);
  List<GrupoObra> findByActivoTrue();
  List<GrupoObra> findByOrganizacionId(Long organizacionId);
}
