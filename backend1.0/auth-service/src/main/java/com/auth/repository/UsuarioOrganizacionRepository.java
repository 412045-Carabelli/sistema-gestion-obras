package com.auth.repository;

import com.auth.entity.UsuarioOrganizacion;
import com.auth.entity.UsuarioOrganizacionId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioOrganizacionRepository extends JpaRepository<UsuarioOrganizacion, UsuarioOrganizacionId> {
  Optional<UsuarioOrganizacion> findFirstByUsuarioIdAndActivoTrue(Long usuarioId);
  List<UsuarioOrganizacion> findByOrganizacionIdAndActivoTrue(Long organizacionId);
}
