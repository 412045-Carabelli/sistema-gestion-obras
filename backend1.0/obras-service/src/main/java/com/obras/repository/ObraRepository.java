package com.obras.repository;

import com.obras.entity.Obra;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ObraRepository extends JpaRepository<Obra, Long> {
    Page<Obra> findByActivoTrue(Pageable pageable);
    Optional<Obra> findByIdAndActivoTrue(Long id);
}
