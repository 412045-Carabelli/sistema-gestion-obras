package com.obras.repository;

import com.obras.entity.AppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppConfigRepository extends JpaRepository<AppConfig, Long> {

    List<AppConfig> findByOrganizacionId(Long organizacionId);

    Optional<AppConfig> findByClaveAndOrganizacionId(String clave, Long organizacionId);
}
