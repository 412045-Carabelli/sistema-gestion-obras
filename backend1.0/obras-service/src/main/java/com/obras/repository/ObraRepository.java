package com.obras.repository;

import com.obras.entity.Obra;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ObraRepository extends JpaRepository<Obra, Long> {
    Page<Obra> findAll(Pageable pageable);
    Page<Obra> findByIdCliente(Long idCliente, Pageable pageable);

    @Query("""
            select o from Obra o
            where (coalesce(o.condicionesPresupuesto, '') <> '' or coalesce(o.observacionesPresupuesto, '') <> '')
            order by o.ultimaActualizacion desc, o.id desc
            """)
    List<Obra> findUltimaConCondiciones(Pageable pageable);
}
