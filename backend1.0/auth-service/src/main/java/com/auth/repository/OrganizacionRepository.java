package com.auth.repository;

import com.auth.entity.Organizacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizacionRepository extends JpaRepository<Organizacion, Long> {
}
