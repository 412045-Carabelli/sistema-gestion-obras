package com.obras.repository;

import com.obras.entity.Obra;
import com.obras.enums.EstadoObraEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ObraRepository extends JpaRepository<Obra, Long> {
    Page<Obra> findAll(Pageable pageable);
    Page<Obra> findByOrganizacionId(Long organizacionId, Pageable pageable);
    long countByOrganizacionIdAndActivoTrue(Long organizacionId);
    Page<Obra> findByIdCliente(Long idCliente, Pageable pageable);
    Page<Obra> findByIdClienteAndOrganizacionId(Long idCliente, Long organizacionId, Pageable pageable);

    @Query("""
        select o from Obra o
        where (:estado is null or o.estadoObra = :estado)
        and (:activo is null or o.activo = :activo)
        and (:organizacionId is null or o.organizacionId = :organizacionId)
        and (:q is null
             or lower(o.nombre) like lower(concat('%', :q, '%'))
             or lower(o.direccion) like lower(concat('%', :q, '%')))
        """)
    Page<Obra> findByFiltros(
        @Param("estado") EstadoObraEnum estado,
        @Param("activo") Boolean activo,
        @Param("organizacionId") Long organizacionId,
        @Param("q") String q,
        Pageable pageable
    );

    @Query("""
            select o from Obra o
            where (coalesce(o.condicionesPresupuesto, '') <> '' or coalesce(o.observacionesPresupuesto, '') <> '')
            order by o.ultimaActualizacion desc, o.id desc
            """)
    List<Obra> findUltimaConCondiciones(Pageable pageable);
}
